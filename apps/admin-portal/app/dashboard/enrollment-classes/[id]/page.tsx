import ClassWorkspace from "@/app/components/ClassWorkspace";
export default async function ClassWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
    return <ClassWorkspace classId={Number((await params).id)} />;
}
