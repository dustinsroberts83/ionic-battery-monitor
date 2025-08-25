# Ionic Battery Monitor

A mobile-friendly web app to simulate monitoring your Ionic IC-24V50-EP 24V lithium battery via Bluetooth.

## 🚀 Quick Deploy to Vercel

### Step 1: Prepare Your Files

1. Create a new folder on your computer called `ionic-battery-monitor`
2. Create the following file structure:
```
ionic-battery-monitor/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── IonicBatteryApp.tsx
├── public/
│   └── manifest.json
├── package.json
├── tailwind.config.ts
└── README.md
```

### Step 2: Copy the Files

Copy all the code from the artifacts I created above into their respective files.

### Step 3: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" button in the top right corner
3. Select "New repository"
4. Name it `ionic-battery-monitor`
5. Make it public
6. Don't initialize with README (we already have one)
7. Click "Create repository"

### Step 4: Upload Your Code to GitHub

Option A: Using GitHub's Web Interface
1. Click "uploading an existing file" on your new repository page
2. Drag and drop all your project files
3. Commit the files

Option B: Using Git Command Line
```bash
cd ionic-battery-monitor
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ionic-battery-monitor.git
git push -u origin main
```

### Step 5: Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click "New Project"
3. Import your `ionic-battery-monitor` repository
4. Vercel will auto-detect it's a Next.js app
5. Click "Deploy"
6. Wait 1-2 minutes for deployment

### Step 6: Access on Your Phone

1. Vercel will give you a URL like `https://ionic-battery-monitor.vercel.app`
2. Open this URL on your phone's browser
3. For the best experience, add it to your home screen:
   - iOS: Tap Share → Add to Home Screen
   - Android: Tap Menu → Add to Home Screen

## 📱 Features

- Mobile-optimized interface
- Simulates IonicBlueBatteries app functionality
- Three tabs: Basic Info, U.I.T.C, System Info
- Real-time battery data simulation
- Dark theme for better battery life

## 🔧 Development

To run locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚨 Important Notes

- This is a **simulation/demo** app
- To connect to a real Ionic battery, you'd need to implement the Web Bluetooth API
- Real Bluetooth functionality requires HTTPS (which Vercel provides)
- The actual IonicBlueBatteries app is available on App Store/Google Play

## 🔮 Future Enhancements

To make this work with your real battery:
1. Implement Web Bluetooth API
2. Add the correct Bluetooth service UUIDs for Ionic batteries
3. Parse the actual battery data format
4. Add error handling for Bluetooth connections

## 📄 License

MIT License - feel free to modify and use as needed!