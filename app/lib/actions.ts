'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
//定义表单结构schema
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer',
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than 0' }),
    status: z.enum(['pending', 'paid'],{
        invalid_type_error: 'Please select an invoice status',
    }),
    date: z.string(),
  });

//创建一个schema，去掉id和date字段
const CreateInvoice = FormSchema.omit({id:true,date:true});

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}


export async function createInvoice(prevState:State,formData:FormData){
    //使用schema验证表单数据
    const validatedFields=CreateInvoice.safeParse({
        customerId:formData.get('customerId'),
        amount:formData.get('amount'),
        status:formData.get('status'),
    });
    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid data. Please fix the errors and try again.',
        }
    }
    const {customerId,amount,status}=validatedFields.data;
    //修改数据格式
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try{
        //插入数据
        await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    }catch(error){
        console.error(error);
        return {
            message: 'Database Error: Failed to create invoice'
        }
    }
    //清除客户端路由缓存
    revalidatePath('/dashboard/invoices');
    //重定向回页面
    redirect('/dashboard/invoices');

}

const UpdateInvoice = FormSchema.omit({id:true,date:true});
//根据id更新数据,id使用js绑定
export async function updateInvoice(id:string,prevState:State,formData:FormData){
    //使用schema验证表单数据
    const validatedFields=UpdateInvoice.safeParse({
        customerId:formData.get('customerId'),
        amount:formData.get('amount'),
        status:formData.get('status'),
    });
    if(!validatedFields.success){
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid data. Please fix the errors and try again.',
        }
    }
    const {customerId,amount,status}=validatedFields.data;
    //修改数据格式
    const amountInCents = amount * 100;
    //更新数据
    try{
        await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`;
    }catch(error){
        console.error(error);
        return {
            message: 'Database Error: Failed to update invoice'
        }
    }
    //清除客户端路由缓存
    revalidatePath('/dashboard/invoices');
    //重定向回页面
    redirect('/dashboard/invoices');
}


export async function deleteInvoice(id:string){
    //删除数据
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    //清除客户端路由缓存
    revalidatePath('/dashboard/invoices');
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }