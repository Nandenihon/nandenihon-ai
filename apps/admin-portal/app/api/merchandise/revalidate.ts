import { revalidateTag } from "next/cache";

const revalidateTagCompat = revalidateTag as unknown as (tag: string) => void;

export function revalidateMerchandise() {
    revalidateTagCompat("merchandise");
}
