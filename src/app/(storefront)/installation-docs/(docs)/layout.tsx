import InstallationDocGate from '@/components/InstallationDocGate';

export default function InstallationDocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <InstallationDocGate>
            {children}
        </InstallationDocGate>
    );
}
