from PIL import Image
import sys
sys.setrecursionlimit(20000)

img = Image.open('/Users/vedansh/Downloads/matcher_landing page/public/Gemini_Generated_Image_56h0uw56h0uw56h0.png').convert('RGBA')
width, height = img.size
pixels = img.load()

visited = set()
queue = []

# Add all currently transparent pixels to the queue to continue the flood fill
for x in range(width):
    for y in range(height):
        r, g, b, a = pixels[x, y]
        if a == 0:
            queue.append((x, y))
            visited.add((x, y))

def is_bg(r, g, b):
    if r > 150 and g > 150 and b > 150:
        if abs(r-g) < 25 and abs(r-b) < 25 and abs(g-b) < 25:
            return True
    return False

bg_pixels = set()
while queue:
    x, y = queue.pop(0)
    for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
            r, g, b, a = pixels[nx, ny]
            if is_bg(r, g, b):
                bg_pixels.add((nx, ny))
                visited.add((nx, ny))
                queue.append((nx, ny))

for x, y in bg_pixels:
    pixels[x, y] = (255, 255, 255, 0)

img.save('/Users/vedansh/Downloads/matcher_landing page/public/Gemini_Generated_Image_56h0uw56h0uw56h0.png')
print("Done processing image. Converted", len(bg_pixels), "more pixels to transparent.")
