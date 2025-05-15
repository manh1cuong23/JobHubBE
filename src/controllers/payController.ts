
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import payos from '~/config/payos';
import { PaymentRequest, PaymentResponse, WebhookData } from '~/constants/payos';
import { Transaction } from '~/models/schemas/Transaction';
import db from '~/services/databaseServices';
export const createPaymentLink = async (req: Request, res: Response) => {
     const idUser = req.body.decodeAuthorization.payload.userId
     const data =  await db.accounts
     .aggregate([
       {
         $match: {
           _id: new ObjectId(req.body.decodeAuthorization.payload.userId)
         }
       },
       {
         $lookup: {
           from: 'Employers',
           localField: 'user_id',
           foreignField: '_id',
           as: 'employer_info'
         }
       },
       {
         $unwind: '$employer_info'
       },])
       .toArray();
       let id = data[0].employer_info._id
      const {idPackage,price} = req.body;
      const TransactionData:any = await db.transactions.insertOne(new Transaction({employer_id:new ObjectId(id),package_id:new ObjectId(idPackage),status:false}))
       const package2 = await db.transactions
       .aggregate([
         {
           $match: {
             _id: new ObjectId(TransactionData.insertedId)
           }
         },
         {
           $lookup: {
             from: 'Employers',
             localField: 'employer_id',
             foreignField: '_id',
             as: 'employer_info'
           }
         },
         {
           $unwind: '$employer_info'
         },
         {
           $lookup: {
             from: 'Packages',
             localField: 'package_id',
             foreignField: '_id',
             as: 'package_info'
           }
         },
         {
           $unwind: '$package_info'
         }
       ])
       .toArray();
      const paymentData: any = {
        orderCode:Date.now(),
        amount: Number(price),
        description: String(TransactionData.insertedId),
        returnUrl: 'http://localhost:8889/recruiter/management/job',
        cancelUrl: 'http://localhost:8889/recruiter/management/job',
         webhookUrl: "https://2a89-2401-d800-5203-8089-fcc8-4f97-ec86-7738.ngrok-free.app/payment/webhook",
      };
  
      const paymentLink = await payos.createPaymentLink(paymentData);
      const response: PaymentResponse = { checkoutUrl: paymentLink.checkoutUrl };
      res.json(response);
    
  }
  
  export const handleWebhook = async (req: Request, res: Response) => {
    try {
      const webhookData = payos.verifyPaymentWebhookData(req.body) as any;
  //       const { idTransaction, event, ...rest } = req.body;

  // // Nếu không có idTransaction, có thể là webhook kiểm tra
  //     if (!idTransaction) {
  //       console.warn('Webhook không có idTransaction. Có thể là webhook kiểm tra từ PayOS.');
  //       return res.status(200).send('Webhook ping OK'); // Trả về 200 OK để không bị retry
  // }
      const idTransaction2 = webhookData.description.split(" ")[1];
      const description = webhookData.description;
      if (webhookData.code === '00') {
         
        const package2 = await db.transactions
        .aggregate([
          {
            $match: {
              _id: new ObjectId(idTransaction2)
            }
          },
          {
            $lookup: {
              from: 'Employers',
              localField: 'employer_id',
              foreignField: '_id',
              as: 'employer_info'
            }
          },
          {
            $unwind: '$employer_info'
          },
          {
            $lookup: {
              from: 'Packages',
              localField: 'package_id',
              foreignField: '_id',
              as: 'package_info'
            }
          },
          {
            $unwind: '$package_info'
          }
        ])
        .toArray();
        const count = Number(package2[0]?.package_info.count)
        if (!idTransaction2) {
          throw new Error('Missing idTransaction2 in webhook data');
        }
        if (!package2) {
          throw new Error('Missing package in webhook data');
        }
        
        // Tăng numberOfFree trong Employer
        const employer = await db.employer.updateOne(
          { _id:new ObjectId(package2[0]?.employer_info?._id) },
          { $inc: { numberOffFree: count } },
        );
  
          await db.transactions.findOneAndUpdate({_id:new ObjectId(idTransaction2)},{$set:{status:true,description}})
        if (!employer) {
          throw new Error(`Employer with ID ${idTransaction2} not found`);
        }
      }else{
        await db.transactions.findOneAndUpdate({_id:new ObjectId(idTransaction2)},{$set:{status:false,description}})

      }
  
      res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Invalid webhook data' });
    }
  };

  export const checkPaymentStatus = async (req: Request, res: Response) => {
    try {
      const { orderCode } = req.params;
      const paymentInfo:any = await payos.getPaymentLinkInformation(Number(orderCode));
  
      if (paymentInfo.status === 'PAID') {
        const item= paymentInfo.items?.[0]?.name;
        if (!item) {
          throw new Error('Missing item data');
        }
  
        const idUserMatch = item.name.match(/Employer ID: (.+)/);
        const idUser = idUserMatch ? idUserMatch[1] : null;
        const amount = paymentInfo.amount; // Lấy employerId từ buyerEmai
        // letl
        let count = 0;
        if(amount == 1000){
            count = 50;
        }else if(amount == 2000){
            count = 100;
        }else if(amount == 3000){
            count = 1000;
        }
        if (!idUser) {
          throw new Error('Missing idUser');
        }
  
        const employer = await db.employer.updateOne(
          { employerId: idUser },
          { $inc: { numberOfFree: count } },
        );
  
        if (!employer) {
          throw new Error(`Employer with ID ${idUser} not found`);
        }
  
        res.json({ message: `Updated numberOfFree for employer ${idUser}`, numberOfFree: count });
      } else {
        res.json({ message: `Payment status: ${paymentInfo.status}` });
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      res.status(500).json({ error: 'Không thể kiểm tra trạng thái thanh toán' });
    }
  };