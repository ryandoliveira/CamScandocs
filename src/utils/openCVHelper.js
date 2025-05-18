// src/utils/openCVHelper.js

export const processDocument = async (canvas) => {
  return new Promise((resolve, reject) => {
    try {
      const src = cv.imread(canvas);
      let dst = new cv.Mat();
      let gray = new cv.Mat();
      let blurred = new cv.Mat();
      let edges = new cv.Mat();

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      // Blur to reduce noise
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Detect edges
      cv.Canny(blurred, edges, 75, 200);

      // Find contours
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let maxContour = null;

      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        if (area > maxArea) {
          maxArea = area;
          maxContour = cnt;
        }
      }

      if (maxContour) {
        const rect = cv.boundingRect(maxContour);
        dst = src.roi(rect);
      } else {
        dst = src.clone(); // fallback in case no contour is found
      }

      // Enhance sharpness (basic unsharp mask)
      let sharpened = new cv.Mat();
      let blurred2 = new cv.Mat();
      cv.GaussianBlur(dst, blurred2, new cv.Size(0, 0), 3);
      cv.addWeighted(dst, 1.5, blurred2, -0.5, 0, sharpened);

      // Output final image to new canvas
      const outputCanvas = document.createElement("canvas");
      cv.imshow(outputCanvas, sharpened);

      // Clean up memory
      src.delete(); dst.delete(); gray.delete(); blurred.delete();
      edges.delete(); contours.delete(); hierarchy.delete();
      sharpened.delete(); blurred2.delete();

      resolve(outputCanvas.toDataURL("image/jpeg", 1.0));
    } catch (error) {
      reject(error);
    }
  });
};
