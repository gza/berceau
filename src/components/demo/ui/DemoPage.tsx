/**
 * Demo Page Component
 */

import { MyIcon } from "./MyIcon"

export interface DemoPageProps {
  title: string
}

export function DemoPage({ title }: DemoPageProps) {
  return (
    <div className="demo-page">
      <h1>{title}</h1>
      <p>
        Welcome to the Demo component! This page demonstrates the drop-in
        component pattern.
      </p>

      <section>
        <h2>How It Works</h2>
        <p>
          This component was automatically discovered and registered by the
          build system. No manual configuration was required beyond creating
          this folder with the necessary files.
        </p>
      </section>

      <section>
        <h2>Key Files</h2>
        <ul>
          <li>
            <code>component.meta.ts</code> - Component metadata (routes,
            navigation)
          </li>
          <li>
            <code>component.controller.ts</code> - Route handlers
          </li>
          <li>
            <code>ui/DemoPage.tsx</code> - This React component
          </li>
        </ul>
      </section>

      <section>
        <h2>Interactive Icon</h2>
        <p>Click the icon below to see a client-side interaction:</p>
        <MyIcon message="Hello from the Demo Page!" />
        <h2>Post List Demo</h2>
        <p>
          You can view, create, and delete demo posts by navigating to the{" "}
          <a href="/demo/posts">posts list page</a>.
        </p>
      </section>
    </div>
  )
}
