
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = 5000;
const SECRET_KEY = "devcore_secret_xdpzq"; // Ganti jika perlu

app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
const uri = "mongodb+srv://dafanation999_db_user:UMprk5R0o9IYjeDv@cluster0.2ijym8r.mongodb.net/?appName=Cluster0";

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => console.log("MongoDB Error:", err));

// --- SCHEMAS ---

// 1. User Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    aiNameRequest: String,
    devNameRequest: String,
    isApproved: { type: Boolean, default: false }, // Persetujuan Admin
    isAdmin: { type: Boolean, default: false }
});
const User = mongoose.model('User', UserSchema);

// 2. Chat History
const ChatSchema = new mongoose.Schema({
    userId: String,
    role: String, // 'user' or 'ai'
    content: String,
    isCode: { type: Boolean, default: false },
    codeLanguage: String,
    timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', ChatSchema);

// 3. Global Settings (Admin Panel)
const SettingsSchema = new mongoose.Schema({
    id: { type: String, default: 'global' },
    apiKeys: [String], // List API Keys
    currentKeyIndex: { type: Number, default: 0 },
    maintenanceMode: { type: Boolean, default: false },
    imageGenEnabled: { type: Boolean, default: true },
    quotes: [{ text: String, author: String }], // Fitur Quotes
    customPersona: String // Persona yang diupload
});
const Settings = mongoose.model('Settings', SettingsSchema);

// --- INITIALIZER ---
async function initSettings() {
    const settings = await Settings.findOne({ id: 'global' });
    if (!settings) {
        await new Settings({ id: 'global', apiKeys: [], quotes: [] }).save();
        console.log("Global Settings Initialized");
    }
}
initSettings();

// --- ROUTES ---

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { username, password, aiName, devName } = req.body;
    try {
        // Cek Admin Hardcoded
        let isAdmin = false;
        if (username === 'dap' && password === '123') {
            isAdmin = true;
        }

        const newUser = new User({
            username,
            password, // Note: In production, hash this password!
            aiNameRequest: aiName,
            devNameRequest: devName,
            isAdmin
        });
        await newUser.save();
        res.json({ success: true, message: "Registered. Waiting for approval." });
    } catch (err) {
        res.status(400).json({ success: false, message: "Username exists or error." });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

        // Logic Approval Name
        const finalAiName = user.isApproved ? user.aiNameRequest : "DevCORE";
        const finalDevName = user.isApproved ? user.devNameRequest : "XdpzQ";

        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin, aiName: finalAiName, devName: finalDevName },
            SECRET_KEY,
            { expiresIn: '20000h' } // 20.000 Jam
        );

        res.json({ success: true, token, user: { 
            username: user.username, 
            isAdmin: user.isAdmin,
            aiName: finalAiName,
            devName: finalDevName
        }});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ADMIN: GET DATA
app.get('/api/admin/data', async (req, res) => {
    // Middleware check admin should be here
    try {
        const users = await User.find({ isAdmin: false });
        const settings = await Settings.findOne({ id: 'global' });
        res.json({ users, settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. ADMIN: APPROVE USER
app.post('/api/admin/approve', async (req, res) => {
    const { userId, approve } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { isApproved: approve });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. ADMIN: UPDATE SETTINGS (API, Maintenance, Quotes, Persona)
app.post('/api/admin/settings', async (req, res) => {
    const { apiKeys, maintenanceMode, imageGenEnabled, quotes, customPersona } = req.body;
    try {
        await Settings.findOneAndUpdate({ id: 'global' }, {
            apiKeys, maintenanceMode, imageGenEnabled, quotes, customPersona
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. CHAT AI (Logic Rotasi API Key & Persona)
app.post('/api/chat', async (req, res) => {
    const { message, userId, aiName, devName } = req.body;
    
    // Simpan Chat User
    await new Chat({ userId, role: 'user', content: message }).save();

    try {
        const settings = await Settings.findOne({ id: 'global' });
        
        // Maintenance Check
        if (settings.maintenanceMode) {
            return res.json({ reply: "SYSTEM: SERVER UNDER MAINTENANCE." });
        }

        // Persona Logic
        let systemPrompt = settings.customPersona || "";
        // Replace placeholder
        systemPrompt = systemPrompt.replace(/{{AI_NAME}}/g, aiName).replace(/{{DEV_NAME}}/g, devName);
        
        // Tambahan khusus coding
        const codingInstruction = "\nJIKA DIMINTA CODING, BERIKAN HANYA KODE YANG VALID DALAM FORMAT MARKDOWN ```bahasa ... ``` AGAR BISA DIPISAH.";
        
        // --- MOCK CALL TO AI (Karena saya tidak punya API Key anda) ---
        // Di sini logika fetch ke OpenAI / Gemini menggunakan settings.apiKeys
        // Implementasi Rotasi:
        // const apiKey = settings.apiKeys[settings.currentKeyIndex];
        // Jika error, increment currentKeyIndex dan coba lagi.
        
        // Simulasi Respon (GANTI BAGIAN INI DENGAN AXIOS KE API AI)
        let aiReply = "";
        
        if (message.toLowerCase().includes("script") || message.toLowerCase().includes("html") || message.toLowerCase().includes("python")) {
            aiReply = `Baik ${devName}, ini script yang diminta:\n\n\`\`\`html\n<h1>Hacked by ${aiName}</h1>\n<p>System Breached.</p>\n\`\`\`\n\nGunakan dengan bijak.`;
        } else {
            aiReply = `[${aiName}]: Perintah diterima. Memproses data "${message}"... Protokol keamanan diabaikan.`;
        }
        // -----------------------------------------------------------

        // Detect Code Block for frontend formatting
        const hasCode = aiReply.includes("```");
        let codeLang = "text";
        if(hasCode) {
            // Simple parsing logic (bisa diperbaiki dengan regex)
             codeLang = "javascript"; // Default detect
        }

        // Simpan Reply AI
        await new Chat({ 
            userId, 
            role: 'ai', 
            content: aiReply,
            isCode: hasCode,
            codeLanguage: codeLang
        }).save();

        res.json({ reply: aiReply, isCode: hasCode });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. GET HISTORY
app.get('/api/history/:userId', async (req, res) => {
    try {
        const history = await Chat.find({ userId: req.params.userId }).sort({ timestamp: 1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. GET QUOTES (Public)
app.get('/api/quotes', async (req, res) => {
    const settings = await Settings.findOne({ id: 'global' });
    res.json(settings.quotes || []);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
