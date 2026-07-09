import { revalidateTag } from "next/cache";

export function revalidateMerchandise() {
    revalidateTag("merchandise", "max");
}
