import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Edit Invoice',
};
//除了 searchParams 之外，页面组件还接受一个名为 params 的 prop，您可以使用它来访问 id
export default async function Page(props:{params:Promise<{id:string}>}) {
    const params = await props.params;
    const id = params.id;
    //并行获取invoice和customers
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ]);
    if(!invoice){
        notFound();
    }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      {/* 传入edit-form组件 */}
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}