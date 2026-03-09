import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
    return (
        <ProductForm
            backPath="/vendor/products"
            onSuccessPath="/vendor/products"
        />
    );
}
