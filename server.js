const express = require('express');
const cors = require('cors');
const fs = require('fs'); // <--- Modul untuk simpan file
const app = express();
const PORT = 8080;
const DATA_FILE = '/sdcard/dc-backend/data.json';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ================= FUNGSI LOAD & SAVE DATA =================
let stockMaster = [];
let transactionLogs = [];

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        const rawData = fs.readFileSync(DATA_FILE);
        const data = JSON.parse(rawData);
        stockMaster = data.stockMaster;
        transactionLogs = data.transactionLogs;
    } else {
        // Data awal jika file belum ada
        stockMaster = [
            { id: 1, name: "SFP+ 10G SR Transceiver", category: "Networking", qty: 25, rack: "Lemari A-1" }
        ];
        transactionLogs = [];
        saveData();
    }
}

function saveData() {
    const data = { stockMaster, transactionLogs };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Load data saat server nyala
loadData();

// ================= ROUTING & API ENDPOINTS =================

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === "dasen" && password === "dasen123") res.json({ success: true });
    else res.status(401).json({ success: false });
});

app.get('/api/stock', (req, res) => res.json(stockMaster));

app.post('/api/stock/in', (req, res) => {
    const { date, name, category, qty, rack, desc } = req.body;
    let existingItem = stockMaster.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existingItem) {
        existingItem.qty += parseInt(qty);
    } else {
        stockMaster.push({ id: Date.now(), name, category, qty: parseInt(qty), rack });
    }
    transactionLogs.push({ id: Date.now(), date, type: "MASUK", name, qty: parseInt(qty), desc });
    
    saveData(); // <--- Simpan ke file
    res.json({ message: "Sukses!" });
});

app.post('/api/stock/out', (req, res) => {
    const { date, itemId, qty, desc } = req.body;
    let targetItem = stockMaster.find(item => item.id == itemId);
    if (!targetItem || targetItem.qty < qty) return res.status(400).json({ message: "Stok kurang!" });
    
    targetItem.qty -= parseInt(qty);
    transactionLogs.push({ id: Date.now() + 1, date, type: "KELUAR", name: targetItem.name, qty: parseInt(qty), desc });
    
    saveData(); // <--- Simpan ke file
    res.json({ message: "Sukses!" });
});

app.get('/api/logs', (req, res) => res.json(transactionLogs));

app.delete('/api/logs/:id', (req, res) => {
    transactionLogs = transactionLogs.filter(log => log.id !== parseInt(req.params.id));
    saveData(); // <--- Simpan ke file
    res.json({ success: true });
});

app.delete('/api/stock/:id', (req, res) => {
    stockMaster = stockMaster.filter(item => item.id !== parseInt(req.params.id));
    saveData(); // <--- Simpan ke file
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`🚀 Server aktif di port ${PORT}`));
