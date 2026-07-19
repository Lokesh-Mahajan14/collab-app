interface Props {
  typingUsers: string[];
}

export default function TypingIndicator({
  typingUsers,
}: Props) {

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic">

      {typingUsers.join(", ")}

      {" "}is typing...

    </div>
  );
}