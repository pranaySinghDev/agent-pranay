import { Button } from "./ui/button";

function ResetChatButton({ resetChat }: { resetChat: () => void }) {
  return (
    <Button onClick={resetChat} variant="default" className="p-2">Reset</Button>
  );
}

export default ResetChatButton;
