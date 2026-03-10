import ProductForm from "@/components/admin/ProductForm";

interface EditProductPageProps {
    params: { id: string };
}

export default function AdminEditProductPage({ params }: EditProductPageProps) {
    return (
        <ProductForm
            backPath="/admin/products"
            onSuccessPath="/admin/products"
            productId={params.id}
        />
    );
}
