# PWA Icons Needed

You need to create these icon files and place them in the `public/` folder:

## Required Icons:

1. **icon-192.png** (192x192px)
   - App icon for Android home screen
   - Square with rounded corners
   - Orange gradient background (#ea580c to #f97316)
   - White football emoji 🏈 or SquadPot logo

2. **icon-512.png** (512x512px)
   - App icon for Android splash screen
   - Same design as 192px but larger

3. **badge-72.png** (72x72px)
   - Notification badge icon
   - Simple white football on transparent or orange background
   - Monochrome design works best

## Quick Way to Create:

### Option 1: Use an online PWA icon generator
- https://www.pwabuilder.com/imageGenerator
- Upload your logo/design
- Download all sizes

### Option 2: Use Figma/Canva
- Create 512x512 canvas
- Orange gradient background
- Add white football emoji or logo text "SP"
- Export as PNG
- Resize to 192x192 and 72x72

### Option 3: Temporary - Use existing image
Copy your existing cloudinary image and resize:
```bash
# You can temporarily use a screenshot or the header image
# Just resize it to 192x192, 512x512, and 72x72
```

## Current State:
- ✅ manifest.json created
- ✅ Service worker updated
- ✅ Meta tags added to index.html
- ❌ Icon images needed (blocking PWA installation)

Once you add these 3 images to `/public/`, the PWA will be ready to install!
