import { PortfolioShowcase } from "@/components/code-port/portfolio-showcase";

export default async function PortfolioPage(
  props: PageProps<"/portfolio/[projectId]">,
) {
  const { projectId } = await props.params;

  return <PortfolioShowcase projectId={projectId} />;
}
