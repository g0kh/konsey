import { PresentationDetailPage } from "@/components/konsey/presentation-detail-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function KonseyPresentationPage({ params }: PageProps) {
  const { id } = await params;
  return <PresentationDetailPage id={id} />;
}
