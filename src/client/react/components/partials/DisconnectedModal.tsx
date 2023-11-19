interface Props {
  trezorConnected: boolean;
}

export const DisconnectedModal: React.FC<Props> = ({ trezorConnected }) => {
  return (
    <>
      {!trezorConnected && (
        <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-80">
          <div className="w-screen max-w-lg p-4 text-red-900 border border-red-100 rounded-md shadow-sm bg-red-50">
            <p className="font-bold">
              Trezor disconnected before signature validation.
            </p>
            <p className="text-sm">Please reconnect it.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default DisconnectedModal;
