import { Router } from "express";
import { productRoutes } from "./product.route.js";

const router = Router();

router.use(productRoutes);

//createCheckoutSession
router.post("/create-checkout-session", async (req, res) => {
    //get products that user sent us and create session
    try {
        
    } catch (error) {
        
    }
});
export { router as paymentRoutes };
