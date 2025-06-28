type PageLayoutProps = {
    children: React.ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => (
    <div className="max-w-xl mx-auto mt-12 p-8 flex flex-col gap-4 items-center justify-center">
        {children}
    </div>
)

export default PageLayout
