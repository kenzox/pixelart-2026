"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const submissionRoutes_1 = __importDefault(require("./routes/submissionRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', submissionRoutes_1.default);
app.get('/', (req, res) => {
    res.send('PixelArt 2026 API is running');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
