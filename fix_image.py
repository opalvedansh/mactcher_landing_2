from PIL import Image

img = Image.open('/Users/vedansh/Downloads/matcher_landing page/public/Gemini_Generated_Image_56h0uw56h0uw56h0.png').convert('RGBA')
width, height = img.size
pixels = img.load()

visited = set()
queue = [(0,0), (width-1, 0), (0, height-1), (width-1, height-1)]
for q in queue:
    visited.add(q)

def is_bg(r, g, b):
    if r > 230 and g > 230 and b > 230: return True
    if 180 < r < 220 and 180 < g < 220 and 180 < b < 220:
        if abs(r-g) < 15 and abs(r-b) < 15 and abs(g-b) < 15:
            return True
    return False

bg_pixels = set()
while queue:
    x, y = queue.pop(0)
    r, g, b, a = pixels[x, y]
    if is_bg(r, g, b):
        bg_pixels.add((x, y))
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                visited.add((nx, ny))
                queue.append((nx, ny))

for x, y in bg_pixels:
    pixels[x, y] = (255, 255, 255, 0)

img.save('/Users/vedansh/Downloads/matcher_landing page/public/Gemini_Generated_Image_56h0uw56h0uw56h0.png')
print("Done processing image. Converted", len(bg_pixels), "pixels.")
