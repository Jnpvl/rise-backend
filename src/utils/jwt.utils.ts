import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secretito";
export const generateJWT = (payload: object): string => {
    return jwt.sign({ payload }, JWT_SECRET, { expiresIn: "24h" });
  };

export const verifyJWT = (token: string): any => {

    try {
        const decoded = jwt.verify(token,JWT_SECRET);
        return decoded;
    }catch (error){
        console.error("error verificando jwt:",error);
        return null;
    }
}