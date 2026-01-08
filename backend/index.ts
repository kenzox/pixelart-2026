import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import submissionRoutes from './routes/submissionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api', submissionRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('PixelArt 2026 API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
