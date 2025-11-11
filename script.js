// ===== TYPE DEFINITIONS =====
// ===== CANVAS AND CONTEXT SETUP =====
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var canvasWrapper = document.getElementById("canvasWrapper");
// ===== STATE VARIABLES =====
// Stores all clicked points that form the shape
var points = [];
// Current mouse position in canvas coordinates
var currentMousePos = null;
// Flag indicating if the shape is closed (polygon complete)
var isShapeClosed = false;
// Test data points to check against the shape
var dataPoints = [];
// Flag to track if mouse is hovering over the first point
var isHoveringFirstPoint = false;
// Grid configuration
var gridSize = 50; // Size of each grid cell in pixels
var canvasWidth = 600;
var canvasHeight = 400;
// Click radius for detecting clicks on the first point (in canvas pixels)
var FIRST_POINT_CLICK_RADIUS = 10;
// ===== INITIALIZATION =====
/**
 * Initialize the canvas with specified dimensions
 */
function initCanvas() {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    drawGrid();
    updateAxisLabels();
}
/**
 * Draw the grid lines on the canvas
 */
function drawGrid() {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    // Draw vertical lines
    for (var x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
    }
    // Draw horizontal lines
    for (var y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
    }
}
/**
 * Update the axis labels based on current dimensions
 */
function updateAxisLabels() {
    var yAxis = document.getElementById("yAxis");
    var xAxis = document.getElementById("xAxis");
    // Calculate grid coordinates (convert canvas pixels to grid units)
    var maxX = Math.floor(canvasWidth / gridSize);
    var maxY = Math.floor(canvasHeight / gridSize);
    // Generate Y-axis labels (bottom to top)
    yAxis.innerHTML = "";
    for (var i = 0; i <= maxY; i++) {
        var label = document.createElement("div");
        label.textContent = i.toString();
        yAxis.appendChild(label);
    }
    // Generate X-axis labels (left to right)
    xAxis.innerHTML = "";
    for (var i = 0; i <= maxX; i++) {
        var label = document.createElement("div");
        label.textContent = i.toString();
        xAxis.appendChild(label);
    }
}
/**
 * Convert canvas pixel coordinates to grid coordinates
 */
function canvasToGrid(canvasX, canvasY) {
    return {
        x: canvasX / gridSize,
        y: (canvasHeight - canvasY) / gridSize, // Flip Y axis (canvas Y grows down, grid Y grows up)
    };
}
/**
 * Convert grid coordinates to canvas pixel coordinates
 */
function gridToCanvas(gridX, gridY) {
    return {
        x: gridX * gridSize,
        y: canvasHeight - gridY * gridSize, // Flip Y axis
    };
}
// ===== DRAWING FUNCTIONS =====
/**
 * Main render function - redraws everything on the canvas
 */
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Redraw grid
    drawGrid();
    // Draw the filled shape if closed
    if (isShapeClosed && points.length >= 3) {
        drawFilledShape();
    }
    // Draw data points (must be drawn before lines to appear behind them)
    drawDataPoints();
    // Draw lines connecting points
    drawLines();
    // Draw all placed points
    drawPoints();
    // Draw preview line from last point to cursor
    if (!isShapeClosed && points.length > 0 && currentMousePos) {
        drawPreviewLine();
    }
}
/**
 * Draw the filled polygon shape
 */
function drawFilledShape() {
    if (points.length < 3)
        return;
    ctx.fillStyle = "rgba(66, 135, 245, 0.3)"; // Semi-transparent blue
    ctx.beginPath();
    var firstPoint = gridToCanvas(points[0].x, points[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (var i = 1; i < points.length; i++) {
        var point = gridToCanvas(points[i].x, points[i].y);
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
}
/**
 * Draw lines connecting all placed points
 */
function drawLines() {
    if (points.length < 2)
        return;
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    var firstPoint = gridToCanvas(points[0].x, points[0].y);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (var i = 1; i < points.length; i++) {
        var point = gridToCanvas(points[i].x, points[i].y);
        ctx.lineTo(point.x, point.y);
    }
    // Close the shape if needed
    if (isShapeClosed) {
        ctx.closePath();
    }
    ctx.stroke();
}
/**
 * Draw preview line from last point to current mouse position
 */
function drawPreviewLine() {
    if (!currentMousePos || points.length === 0)
        return;
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.beginPath();
    var lastPoint = gridToCanvas(points[points.length - 1].x, points[points.length - 1].y);
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentMousePos.x, currentMousePos.y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset to solid line
}
/**
 * Draw all placed points
 */
function drawPoints() {
    points.forEach(function (point, index) {
        var canvasPoint = gridToCanvas(point.x, point.y);
        // First point gets special treatment
        if (index === 0) {
            // Draw outer glow if hovering (when there are enough points to close)
            if (isHoveringFirstPoint && points.length >= 3 && !isShapeClosed) {
                ctx.fillStyle = "rgba(255, 68, 68, 0.3)";
                ctx.beginPath();
                ctx.arc(canvasPoint.x, canvasPoint.y, 12, 0, Math.PI * 2);
                ctx.fill();
            }
            // Draw red circle for first point
            ctx.fillStyle = "#ff4444";
            ctx.beginPath();
            ctx.arc(canvasPoint.x, canvasPoint.y, 7, 0, Math.PI * 2);
            ctx.fill();
            // Draw white border
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
            // Draw inner white dot to make it more visible
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(canvasPoint.x, canvasPoint.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        else {
            // Draw regular point
            ctx.fillStyle = "#333";
            ctx.beginPath();
            ctx.arc(canvasPoint.x, canvasPoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
            // Draw white border
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}
/**
 * Draw data points (green if inside shape, black if outside)
 */
function drawDataPoints() {
    var insideCount = 0;
    var outsideCount = 0;
    dataPoints.forEach(function (point) {
        var canvasPoint = gridToCanvas(point.x, point.y);
        var isInside = isShapeClosed && isPointInPolygon(point, points);
        // Set color based on whether point is inside the shape
        ctx.fillStyle = isInside ? "#22c55e" : "#000000"; // Green or black
        // Draw small circle for data point
        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();
        // Count points
        if (isInside)
            insideCount++;
        else
            outsideCount++;
    });
    // Update statistics display
    document.getElementById("pointsInside").textContent =
        insideCount.toString();
    document.getElementById("pointsOutside").textContent =
        outsideCount.toString();
}
// ===== GEOMETRY ALGORITHMS =====
/**
 * Check if a point is inside a polygon using ray casting algorithm
 * @param point - The point to check
 * @param polygon - Array of points forming the polygon
 * @returns true if point is inside polygon, false otherwise
 */
function isPointInPolygon(point, polygon) {
    if (polygon.length < 3)
        return false;
    var inside = false;
    var x = point.x;
    var y = point.y;
    // Ray casting algorithm: cast a ray from the point to infinity
    // Count how many times it crosses the polygon edges
    // Odd number of crossings = inside, even = outside
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i].x;
        var yi = polygon[i].y;
        var xj = polygon[j].x;
        var yj = polygon[j].y;
        // Check if ray crosses this edge
        var intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect)
            inside = !inside;
    }
    return inside;
}
/**
 * Calculate distance between two points in canvas coordinates
 */
function distanceInCanvas(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
/**
 * Check if a canvas point is near the first point
 */
function isNearFirstPoint(canvasPos) {
    if (points.length === 0)
        return false;
    var firstPointCanvas = gridToCanvas(points[0].x, points[0].y);
    var distance = distanceInCanvas(canvasPos, firstPointCanvas);
    return distance <= FIRST_POINT_CLICK_RADIUS;
}
/**
 * Update hint message based on current state
 */
function updateHint() {
    var hintElement = document.getElementById("hint");
    var hintText = document.getElementById("hintText");
    if (isShapeClosed) {
        hintElement.style.display = "none";
    }
    else if (points.length === 0) {
        hintElement.style.display = "none";
    }
    else if (points.length < 3) {
        hintElement.style.display = "block";
        hintText.textContent = "Place at least ".concat(3 - points.length, " more point(s) to create a shape");
    }
    else if (isHoveringFirstPoint) {
        hintElement.style.display = "block";
        hintText.textContent = "Click the red point to close the shape!";
    }
    else {
        hintElement.style.display = "block";
        hintText.textContent =
            "Click on the red (first) point to close the shape";
    }
}
// ===== EVENT HANDLERS =====
/**
 * Handle mouse move event - update cursor position and check hover state
 */
canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    var canvasX = e.clientX - rect.left;
    var canvasY = e.clientY - rect.top;
    // Store current mouse position for preview line
    currentMousePos = { x: canvasX, y: canvasY };
    // Check if hovering over first point
    var wasHovering = isHoveringFirstPoint;
    isHoveringFirstPoint =
        !isShapeClosed &&
            points.length >= 3 &&
            isNearFirstPoint(currentMousePos);
    // Update cursor style
    if (isHoveringFirstPoint) {
        canvas.classList.add("hovering-first-point");
    }
    else {
        canvas.classList.remove("hovering-first-point");
    }
    // Convert to grid coordinates for display
    var gridPos = canvasToGrid(canvasX, canvasY);
    document.getElementById("mousePosition").textContent = "Mouse Position: X: ".concat(gridPos.x.toFixed(2), ", Y: ").concat(gridPos.y.toFixed(2));
    // Update hint if hover state changed
    if (wasHovering !== isHoveringFirstPoint) {
        updateHint();
    }
    // Redraw to show preview line and hover effect
    render();
});
/**
 * Handle mouse leave event - clear cursor position
 */
canvas.addEventListener("mouseleave", function () {
    currentMousePos = null;
    isHoveringFirstPoint = false;
    canvas.classList.remove("hovering-first-point");
    document.getElementById("mousePosition").textContent =
        "Mouse Position: --";
    updateHint();
    render();
});
/**
 * Handle canvas click - add point or close shape
 */
canvas.addEventListener("click", function (e) {
    if (isShapeClosed)
        return; // Don't allow more points after shape is closed
    var rect = canvas.getBoundingClientRect();
    var canvasX = e.clientX - rect.left;
    var canvasY = e.clientY - rect.top;
    var clickPos = { x: canvasX, y: canvasY };
    // Check if clicking on the first point to close the shape
    if (points.length >= 3 && isNearFirstPoint(clickPos)) {
        isShapeClosed = true;
        document.getElementById("shapeClosed").textContent = "Yes";
        isHoveringFirstPoint = false;
        canvas.classList.remove("hovering-first-point");
        updateHint();
        render();
        return;
    }
    // Add new point at clicked location
    var gridPos = canvasToGrid(canvasX, canvasY);
    points.push(gridPos);
    document.getElementById("pointsCount").textContent =
        points.length.toString();
    updateHint();
    render();
});
/**
 * Handle "Apply Dimensions" button click
 */
document.getElementById("applyBtn").addEventListener("click", function () {
    var widthInput = document.getElementById("width");
    var heightInput = document.getElementById("height");
    var gridSizeInput = document.getElementById("gridSize");
    canvasWidth = parseInt(widthInput.value);
    canvasHeight = parseInt(heightInput.value);
    gridSize = parseInt(gridSizeInput.value);
    // Reset everything
    points = [];
    dataPoints = [];
    isShapeClosed = false;
    isHoveringFirstPoint = false;
    currentMousePos = null;
    // Update UI
    document.getElementById("pointsCount").textContent = "0";
    document.getElementById("shapeClosed").textContent = "No";
    document.getElementById("pointsInside").textContent = "0";
    document.getElementById("pointsOutside").textContent = "0";
    updateHint();
    initCanvas();
    render();
});
/**
 * Handle "Clear Shape" button click
 */
document.getElementById("clearBtn").addEventListener("click", function () {
    points = [];
    dataPoints = [];
    isShapeClosed = false;
    isHoveringFirstPoint = false;
    currentMousePos = null;
    // Update UI
    document.getElementById("pointsCount").textContent = "0";
    document.getElementById("shapeClosed").textContent = "No";
    document.getElementById("pointsInside").textContent = "0";
    document.getElementById("pointsOutside").textContent = "0";
    updateHint();
    render();
});
/**
 * Handle "Generate Test Data" button click
 * Creates random points across the grid to test the shape detection
 */
document.getElementById("generateDataBtn").addEventListener("click", function () {
    dataPoints = [];
    // Generate 50 random points within the grid bounds
    var maxX = canvasWidth / gridSize;
    var maxY = canvasHeight / gridSize;
    for (var i = 0; i < 50; i++) {
        dataPoints.push({
            x: Math.random() * maxX,
            y: Math.random() * maxY,
        });
    }
    render();
});
/**
 * Process provided data and check which points are inside the shape
 * This function can be called with custom data
 * @param data - Array of points with x and y coordinates
 */
function processDataPoints(data) {
    dataPoints = data;
    render();
}
// ===== INITIALIZE APPLICATION =====
initCanvas();
updateHint();
render();
// Make processDataPoints available globally for testing
window.processDataPoints = processDataPoints;
