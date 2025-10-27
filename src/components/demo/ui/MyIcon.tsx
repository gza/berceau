import icon from "./info.svg"

// Client-side script.
// React engine will ignore 'onclick' directly in JSX because this is meant to be used in the browser.
// The solution is to inject a <script> block that will run in the browser.
const clientScript = (message) => {
  return `
    document.querySelector('#icon').addEventListener('click', (event) => {
     alert('this is your message ${message}');
    });
  `
}

export function MyIcon({ message }: { message: string }) {
  return (
    <div>
      <img src={icon} id="icon" alt="Icon" />
      <script>{clientScript(message)}</script>
      {/* ℹ️ Note: This has to be after the elements you want to interact with */}
    </div>
  )
}
