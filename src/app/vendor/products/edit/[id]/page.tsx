import ProductForm from "@/components/admin/ProductForm";

interface EditProductPageProps {
    params: { id: string };
}

export default function VendorEditProductPage({ params }: EditProductPageProps) {
    return (
        <ProductForm
            backPath="/vendor/products"
            onSuccessPath="/vendor/products"
            productId={params.id}
        />
    );
}
