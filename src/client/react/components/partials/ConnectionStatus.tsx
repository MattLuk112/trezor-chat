interface Props {
  connected: boolean;
}

export const ConnectionStatus: React.FC<Props> = ({ connected }) => {
  return (
    <>
      <div
        className={`p-2 text-sm font-bold text-center border-t border-b border-r border-gray-300 rounded-tl-md rounded-tr-md ${
          connected ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'
        }`}
      >
        {connected ? 'Connected' : 'Disconnected'}
      </div>
    </>
  );
};

export default ConnectionStatus;
