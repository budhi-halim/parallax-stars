// CSS Variable Names
const STAR_COLOR = '--star-color'; // Star color CSS variable name
const STAR_SIZE = '--star-size'; // Star size CSS variable name
const STAR_TOP = '--star-top'; // Star top CSS variable name
const STAR_LEFT = '--star-left'; // Star left CSS variable name
const STAR_ROTATION = '--star-rotation'; // Star rotation CSS variable name
const STAR_DURATION = '--star-duration'; // Star duration CSS variable name
const STAR_DISTANCE = '--star-distance'; // Star distance CSS variable name

const RAY_ANGLE = '--ray-angle'; // Ray angle CSS variable name
const RAY_WIDTH = '--ray-width'; // Ray width CSS variable name
const RAY_HEIGHT = '--ray-height'; // Ray height CSS variable name
const RAY_PATH = '--ray-path'; // Ray path CSS variable name
const RAY_TRANSLATE_X = '--ray-translate-x'; // Ray translate-x CSS variable name
const RAY_TRANSLATE_Y = '--ray-translate-y'; // Ray translate-y CSS variable name

// Star Properties
const MIN_STAR_SIZE = 1.5; // Minimum star size (% of screen height)
const MAX_STAR_SIZE = 2; // Maximum star size (% of screen height)
const STAR_SIZE_PRECISION = 3; // The number of decimal points for star size
const STAR_POSITION_PRECISION = 5; // The number of decimal points for star position

const MIN_STAR_DURATION = 2; // Minimum star animation duration (s)
const MAX_STAR_DURATION = 8; // Maximum star animation duration (s)

const STAR_ROTATION_RANGE = 30; // Maximum star random rotation (deg)

const MIN_STAR_DISTANCE_FACTOR = 2; // Minimum star distance factor distance ratio
const MAX_STAR_DISTANCE_FACTOR = 4; // Maximum star distance factor distance ratio
const STAR_DISTANCE_FACTOR_PRECISION = 3; // The number of decimal points for star distance factor

const STAR_CREATION_HORIZONTAL_BUFFER = 0; // Area on the left and right side of user view allowed for star creation
const STAR_CREATION_VERTICAL_BUFFER = 0.25; // Area above and below the user view allowed for star creation

// Star Density
const MIN_STAR_DENSITY = 10; // Minimum star density (%)
const MAX_STAR_DENSITY = 15; // Maximum star density (%)

// Ray Properties
const RAY_SHARPNESS = 4; // Sharpness of the star rays
const RAY_SIZE_PRECISION = 3; // The number of decimal points for ray width and height

// Vertical Ray Size Ratios
const MIN_VERTICAL_RAY_WIDTH_RATIO = 2; // Minimum ratio of star size to ray width (vertical rays)
const MAX_VERTICAL_RAY_WIDTH_RATIO = 2.2; // Maximum ratio of star size to ray width (vertical rays)
const MIN_VERTICAL_RAY_HEIGHT_RATIO = 2.7; // Minimum ratio of ray height to star size (vertical rays)
const MAX_VERTICAL_RAY_HEIGHT_RATIO = 3; // Maximum ratio of ray height to star size (vertical rays)

// Horizontal Ray Size Ratios
const MIN_HORIZONTAL_RAY_WIDTH_RATIO = 2; // Minimum ratio of star size to ray width (horizontal rays)
const MAX_HORIZONTAL_RAY_WIDTH_RATIO = 2.2; // Maximum ratio of star size to ray width (horizontal rays)
const MIN_HORIZONTAL_RAY_HEIGHT_RATIO = 2; // Minimum ratio of ray height to star size (horizontal rays)
const MAX_HORIZONTAL_RAY_HEIGHT_RATIO = 2.4; // Maximum ratio of ray height to star size (horizontal rays)

// Filler Ray Size Ratios
const MIN_FILLER_RAY_WIDTH_RATIO = 1.1; // Minimum ratio of star size to ray width (filler rays)
const MAX_FILLER_RAY_WIDTH_RATIO = 1.3; // Maximum ratio of star size to ray width (filler rays)
const MIN_FILLER_RAY_HEIGHT_RATIO = 1.1; // Minimum ratio of ray height to star size (filler rays)
const MAX_FILLER_RAY_HEIGHT_RATIO = 1.3; // Maximum ratio of ray height to star size (filler rays)

// DOM Elements
const SKY = document.querySelector('.sky'); // The sky container element
const PARALLAX_WRAPPER = document.querySelector('.parallax-wrapper'); // The parallax wrapper element
const PARALLAX_ITEM_CLASS = 'parallax-item'; // Parallax item class name

// Dimensions
const SCREEN_WIDTH = window.screen.width; // Screen width (px)
const SCREEN_HEIGHT = window.screen.height; // Screen height (px)

// Parallax
const PARALLAX_WRAPPER_PERSPECTIVE = 10 ** STAR_DISTANCE_FACTOR_PRECISION; // Wrapper perspective for parallax effect

// Star Area
const AVERAGE_STAR_AREA = (MIN_STAR_SIZE ** 2 + MAX_STAR_SIZE ** 2) * SCREEN_HEIGHT / 2; // Average star area (px^2)

// Ray Path Percentages
const Y_PERCENT_RAY_PATH = 2 / (1 + 2 ** - (2 ** RAY_SHARPNESS / 10)) - 1; // Y control point position
const X_PERCENT_RAY_PATH = Y_PERCENT_RAY_PATH / 2; // X control point position

// Star Colors
const starColors = [
  { color: '#ADD8E6', weight: 0.7 }, // Blue
  { color: '#FFE4B5', weight: 0.2 }, // Yellow
  { color: '#FFA07A', weight: 0.1 }, // Orange
];

const cumulativeStarColors =  (() => {
  const cumulativeArray = [];
  let totalWeight = 0;

  for (const { color, weight } of starColors) {
    totalWeight += weight;
    cumulativeArray.push({ color, cumulativeWeight: totalWeight})
  }

  return cumulativeArray;
})();

// Ray Angles
const verticalRayAngles = [0, 180];
const horizontalRayAngles = [90, 270];
const fillerRayAngles = [45, 135, 225, 315];

// Cache Maps
const translateCache = new Map();
const rayPathCache = new Map();

// Global Variables

// Star Creation
let minStarCount; // Variable minimum star count (assigned/updated using updateStars function)
let maxStarCount; // Variable maximum star count (assigned/updated using updateStars function)
let starCount = 0; // Current number of stars on the screen (updated at the end of createStar function)
let isAddingStars = false; // Flag to prevent concurrent star creations (set to false during updateStars function execution)

// Scroll Properties (assigned/updated using scrollProperties function)
let scrollPosition; // Current scroll position

// Resize Properties (assigned/updated using resizeProperties function)
let viewportWidth; // Current viewport width
let viewportHeight; // Current viewport height

// Star Container Properties (scroll and resize) global variables (assigned/updated using starContainerProperties function)
let leftStarContainer; // Buffered left edge of star container
let rightStarContainer; // Buffered right edge of star container
let topStarContainer; // Buffered top edge of star container
let bottomStarContainer; // Buffered bottom edge of star container

let minStarCountLimit; // Minimum star count limit
let maxStarCountLimit; // Maximum star count limit
let starCountLimitRange; // Star count limit range

// Utility Functions
function clamp(minVal, optVal, maxVal) {
  return Math.max(minVal, Math.min(optVal, maxVal));
}

function getPx(percentScreenHeight) {
  return Math.round(percentScreenHeight * SCREEN_HEIGHT / 100);
}

function getTranslate(angleDegree, rayWidthRatio, rayHeightRatio) {
  // Generate cache key (integer)
  const scaleFactor = 10 ** RAY_SIZE_PRECISION;
  const key = `${angleDegree}_${Math.round(rayWidthRatio * scaleFactor)}_${Math.round(rayHeightRatio * scaleFactor)}`;

  // Check cache
  if (translateCache.has(key)) {
    return translateCache.get(key);
  }

  // Calculate translate
  const angleRadian = angleDegree * Math.PI / 180;
  const result =  {
    translateX: `${(Math.sin(angleRadian) * rayWidthRatio * rayHeightRatio / 2 - 0.5) * 100}%`,
    translateY: `${(-Math.cos(angleRadian) / 2 - 0.5) * 100}%`
  };

  // Store result
  translateCache.set(key, result);

  return result;
}

function randomRange(minVal, maxVal, decimalDigits = 0) {
  const randomNum = Math.random() * (maxVal - minVal) + minVal;
  const factor = 10 ** decimalDigits;
  return Math.round(randomNum * factor) / factor;
}

function randomSkewedRange(minVal, maxVal, decimalDigits = 0) {
  const u = Math.random();
  const transform = 1 - Math.sqrt(1 - u);
  const randomNum = minVal + (maxVal - minVal) * transform;
  const factor = 10 ** decimalDigits;
  return Math.round(randomNum * factor) / factor;
}

function getAdjustedDimension(start, end, distanceFactor) {
  const originalDimension = end - start;
  const dimensionChange = originalDimension * (distanceFactor - 1) / 2;
  const adjustedStart = start - dimensionChange;
  const adjustedEnd = end + dimensionChange;
  return { start: adjustedStart, end: adjustedEnd };
}

function randomColor() {
  const random = Math.random();
  for (const { color, cumulativeWeight } of cumulativeStarColors) {
    if (random < cumulativeWeight) {
      return color;
    }
  }
}

function getRayPath(rayWidthPx, rayHeightPx) {
  // Generate cache key
  const key = `${rayWidthPx}_${rayHeightPx}`;

  // Check cache
  if (rayPathCache.has(key)) {
    return rayPathCache.get(key);
  }

  // Calculate ray path
  const result = `'M0,${rayHeightPx} C${Math.round(rayWidthPx * X_PERCENT_RAY_PATH)},${rayHeightPx} ${Math.round(rayWidthPx * 0.5)},${Math.round(rayHeightPx * Y_PERCENT_RAY_PATH)} ${Math.round(rayWidthPx * 0.5)},0 C${Math.round(rayWidthPx * 0.5)},${Math.round(rayHeightPx * Y_PERCENT_RAY_PATH)} ${Math.round(rayWidthPx * (1 - X_PERCENT_RAY_PATH))},${rayHeightPx} ${rayWidthPx},${rayHeightPx} Z'`;

  // Store result
  rayPathCache.set(key, result);

  return result
}

function throttle(func, wait) {
  let timeout = null;
  let previous = 0;
  let args;
  let context;

  const later = function() {
    previous = Date.now();
    timeout = null;
    func.apply(context, args);
  };

  return function(...arguments) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    context = this;
    args = arguments;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }
  };
}

// Global Variable Functions
function scrollProperties() {
  scrollPosition = PARALLAX_WRAPPER.scrollTop;
}

function resizeProperties() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
}

function starContainerProperties() {
  // Scroll and element positions
  const containerWidth = SKY.scrollWidth;
  const containerHeight = SKY.scrollHeight;
  const posX = PARALLAX_WRAPPER.scrollLeft;
  const posY = PARALLAX_WRAPPER.scrollTop;

  // Container edge positions
  leftStarContainer = Math.min(0, posX - viewportWidth * STAR_CREATION_VERTICAL_BUFFER);
  rightStarContainer = clamp(posX + viewportWidth, posX + viewportWidth * (STAR_CREATION_HORIZONTAL_BUFFER + 1), containerWidth);
  topStarContainer = Math.max(0, posY - viewportHeight * STAR_CREATION_VERTICAL_BUFFER);
  bottomStarContainer = clamp(posY + viewportHeight, posY + viewportHeight * (STAR_CREATION_VERTICAL_BUFFER + 1), containerHeight);

  const containerArea = (rightStarContainer - leftStarContainer) * (bottomStarContainer - topStarContainer);

  // Star count
  minStarCountLimit = containerArea * MIN_STAR_DENSITY / (AVERAGE_STAR_AREA * 100);
  maxStarCountLimit = containerArea * MAX_STAR_DENSITY / (AVERAGE_STAR_AREA * 100);
  starCountLimitRange = maxStarCountLimit - minStarCountLimit;
}

// Main Functions
function createStar() {
  // Create star element
  const star = document.createElement('div');
  star.classList.add('star', PARALLAX_ITEM_CLASS);

  // Random distance
  const distanceFactor = randomRange(MIN_STAR_DISTANCE_FACTOR, MAX_STAR_DISTANCE_FACTOR, STAR_DISTANCE_FACTOR_PRECISION);
  const distance = Math.round(PARALLAX_WRAPPER_PERSPECTIVE * (distanceFactor - 1));
  star.style.setProperty(STAR_DISTANCE, `-${distance}px`);

  // Random position
  const adjustedHorizontalDimension = getAdjustedDimension(leftStarContainer, rightStarContainer, distanceFactor);
  const adjustedVerticalDimension = getAdjustedDimension(topStarContainer, bottomStarContainer, distanceFactor);
  const posX = randomRange(adjustedHorizontalDimension.start, adjustedHorizontalDimension.end);
  const posY = randomSkewedRange(adjustedVerticalDimension.start, adjustedVerticalDimension.end);
  star.style.setProperty(STAR_TOP, `${posY}px`);
  star.style.setProperty(STAR_LEFT, `${posX}px`);

  // Random size
  const size = randomRange(MIN_STAR_SIZE, MAX_STAR_SIZE, STAR_SIZE_PRECISION);
  star.style.setProperty(STAR_SIZE, size);

  // Random rotation
  const rotationDegree = randomRange(-STAR_ROTATION_RANGE, STAR_ROTATION_RANGE);
  star.style.setProperty(STAR_ROTATION, `${rotationDegree}deg`);

  // Random color
  const color = randomColor();
  star.style.setProperty(STAR_COLOR, color);

  // Random duration
  const duration = randomRange(MIN_STAR_DURATION * 1000, MAX_STAR_DURATION * 1000);
  star.style.setProperty(STAR_DURATION, `${duration}ms`);

  // Create rays
  for (const angleDegree of verticalRayAngles) {
    createRay(star, size, angleDegree, 'vertical');
  }
  
  for (const angleDegree of horizontalRayAngles) {
    createRay(star, size, angleDegree, 'horizontal');
  }

  for (const angleDegree of fillerRayAngles) {
    createRay(star, size, angleDegree, 'filler');
  }

  // Return star element
  return star;
}

function createRay(star, starSize, angleDegree, rayType) {
  // Create ray element
  const ray = document.createElement('div');
  ray.classList.add('ray');

  // Determine ray size ratios
  let rayWidthRatio = 0;
  let rayHeightRatio = 0;

  switch (rayType) {
    case 'horizontal':
      rayWidthRatio = randomRange(MIN_HORIZONTAL_RAY_WIDTH_RATIO, MAX_HORIZONTAL_RAY_WIDTH_RATIO, RAY_SIZE_PRECISION);
      rayHeightRatio = randomRange(MIN_HORIZONTAL_RAY_HEIGHT_RATIO, MAX_HORIZONTAL_RAY_HEIGHT_RATIO, RAY_SIZE_PRECISION);
      break;
    
    case 'vertical':
      rayWidthRatio = randomRange(MIN_VERTICAL_RAY_WIDTH_RATIO, MAX_VERTICAL_RAY_WIDTH_RATIO, RAY_SIZE_PRECISION);
      rayHeightRatio = randomRange(MIN_VERTICAL_RAY_HEIGHT_RATIO, MAX_VERTICAL_RAY_HEIGHT_RATIO, RAY_SIZE_PRECISION);
      break;
    
    case 'filler':
      rayWidthRatio = randomRange(MIN_FILLER_RAY_WIDTH_RATIO, MAX_FILLER_RAY_WIDTH_RATIO, RAY_SIZE_PRECISION);
      rayHeightRatio = randomRange(MIN_FILLER_RAY_HEIGHT_RATIO, MAX_FILLER_RAY_HEIGHT_RATIO, RAY_SIZE_PRECISION);
      break;
    
    default:
      break;
  }

  // Ray dimensions
  const rayWidth = starSize / rayWidthRatio;
  const rayHeight = starSize * rayHeightRatio;
  const rayWidthPx = getPx(rayWidth);
  const rayHeightPx = getPx(rayHeight);

  // Adjust positioning
  const translate = getTranslate(angleDegree, rayWidthRatio, rayHeightRatio);

  // Style rays
  ray.style.setProperty(RAY_ANGLE, `${angleDegree}deg`);
  ray.style.setProperty(RAY_WIDTH, `${rayWidthPx}px`);
  ray.style.setProperty(RAY_HEIGHT, `${rayHeightPx}px`);
  ray.style.setProperty(RAY_TRANSLATE_X, translate.translateX);
  ray.style.setProperty(RAY_TRANSLATE_Y, translate.translateY);
  ray.style.setProperty(RAY_PATH, `${getRayPath(rayWidthPx, rayHeightPx)}`);

  // Append ray
  star.appendChild(ray);
}

function updateStars() {
  // Prevent concurrent function calls
  isAddingStars = true;

  // Dynamic minimum and maximum star count
  minStarCount = minStarCountLimit + randomRange(0, starCountLimitRange / 3);
  maxStarCount = maxStarCountLimit - randomRange(0, starCountLimitRange / 3);
  const starsToAdd = maxStarCount - starCount;

  // Create document fragment
  const fragment = document.createDocumentFragment();
  
  // Create stars
  for (let i = 0; i < starsToAdd; i++) {
    const star = createStar();
    fragment.appendChild(star);
  }

  starCount += starsToAdd;

  // Update DOM
  SKY.appendChild(fragment);

  // Release lock
  isAddingStars = false;
}

// Star creation and removal event listeners
SKY.addEventListener('animationend', (event) => {
  if (event.target.classList.contains('star')) {
    event.target.remove();
    starCount--;
    if (starCount < minStarCount && !isAddingStars) {
      updateStars();
    }
  }
});

// Scroll event listeners
PARALLAX_WRAPPER.addEventListener('scroll', throttle(() => {
  scrollProperties();
  starContainerProperties();
}, 100));

// Resize event listeners
window.addEventListener('resize', throttle(() => {
  resizeProperties();
  starContainerProperties();
}, 100));

// Initialize animation
PARALLAX_WRAPPER.style.perspective = `${PARALLAX_WRAPPER_PERSPECTIVE}px`;
scrollProperties();
resizeProperties();
starContainerProperties();
updateStars();