/**
 * Demo Page Component
 */

export interface DemoPageProps {
  title: string
}

export function DemoPage({ title }: DemoPageProps) {
  return (
    <div className="demo-page">
      <h1>{title}</h1>
      <p>
        Welcome to the Demo feature! This page demonstrates the drop-in
        component pattern.
      </p>

      <section>
        <h2>How It Works</h2>
        <p>
          This feature was automatically discovered and registered by the build
          system. No manual configuration was required beyond creating this
          folder with the necessary files.
        </p>
      </section>

      <section>
        <h2>Key Files</h2>
        <ul>
          <li>
            <code>feature.meta.ts</code> - Feature metadata (routes, navigation)
          </li>
          <li>
            <code>feature.module.ts</code> - NestJS module definition
          </li>
          <li>
            <code>feature.controller.ts</code> - Route handlers
          </li>
          <li>
            <code>ui/DemoPage.tsx</code> - This React component
          </li>
        </ul>
      </section>
    </div>
  )
}
