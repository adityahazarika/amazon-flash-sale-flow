import { v4 as uuidv4 } from "uuid";

export const generateOrderId = () => `ORD-${uuidv4()}`;

export async function setTimeOutSync(time){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve("done")
        },time)
    })
}