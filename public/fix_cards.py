import sys
from PIL import Image

sys.setrecursionlimit(20000)

files = [
    ('discover-placeholder.jpeg', 'discover-placeholder-fixed.png'),
    ('swipe-placeholder.png', 'swipe-placeholder-fixed.png'),
    ('match-placeholder.png', 'match-placeholder-fixed.png'),
    ('collaborate-placeholder.png', 'collaborate-placeholder-fixed.png')
]

def is_bg(r, g, b):
    if r > 150 and g > 150 and b > 150:
        if abs(r-g) < 25 and abs(r-b) < 25 and abs(g-b) < 25:
            return True
    return False

for in_name, out_name in files:
    try:
        img = Image.open(in_name).convert('RGBA')
        width, height = img.size
        pixels = img.load()

        visited = set()
        queue = [(0,0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        for q in queue:
            visited.add(q)
            
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

        # 2nd pass
        queue = list(bg_pixels)
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
            
        img.save(out_name)
        print(f"Processed {in_name}, cleared {len(bg_pixels)} pixels.")
    except Exception as e:
        print(f"Failed on {in_name}: {e}")
