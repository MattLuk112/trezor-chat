import { Identification } from '../../../types';

interface Props {
  connected: boolean;
  guestIdentification: Identification | null;
  guestVerification: string;
  identification: Identification;
}

export const Identifications: React.FC<Props> = ({
  connected,
  guestIdentification,
  guestVerification,
  identification,
}) => {
  return (
    <>
      <div className="text-xs bg-gray-100 border-t border-b border-gray-300 divide-y divide-gray-200">
        <div className="flex items-center justify-between p-2">
          <p className="w-1/5 font-bold">Me</p>
          <p>{identification.address}</p>
          <p className="w-1/5 text-right">
            <span className="font-bold text-emerald-500">Valid signature</span>
          </p>
        </div>
        {connected && guestIdentification && (
          <div className="flex items-center justify-between p-2">
            <p className="w-1/5 font-bold">Guest</p>
            <p>{guestIdentification.address}</p>
            <p className="w-1/5 text-right">
              {guestVerification === 'pending' && (
                <span className="font-bold text-yellow-500">
                  Pending validation
                </span>
              )}
              {guestVerification === 'valid' && (
                <span className="font-bold text-emerald-500">
                  Valid signature
                </span>
              )}
              {guestVerification === 'invalid' && (
                <span className="font-bold text-red-500">
                  Invalid signature
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Identifications;
