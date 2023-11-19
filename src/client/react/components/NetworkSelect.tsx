import { Network } from '../../types';

type Props = {
  selectNetwork: (network: Network) => void;
};

export const NetworkSelect: React.FC<Props> = ({ selectNetwork }) => {
  return (
    <>
      <div className="flex items-center justify-center flex-grow space-x-8">
        <button
          type="button"
          className="px-4 py-2 text-2xl border border-gray-300 rounded-md hover:bg-emerald-500 hover:text-emerald-100 hover:border-emerald-500"
          onClick={() => selectNetwork(Network.Mainnet)}
        >
          Mainnet
        </button>
        <button
          type="button"
          className="px-4 py-2 text-2xl border border-gray-300 rounded-md hover:bg-emerald-500 hover:text-emerald-100 hover:border-emerald-500"
          onClick={() => selectNetwork(Network.Testnet)}
        >
          Testnet
        </button>
      </div>
    </>
  );
};

export default NetworkSelect;
