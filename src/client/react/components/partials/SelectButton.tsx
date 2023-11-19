interface Props {
  icon?: boolean;
  children: any;
  onPress: () => void;
}

export const SelectButton: React.FC<Props> = ({
  icon = true,
  children,
  onPress,
}) => {
  return (
    <>
      <button
        type="button"
        className="flex items-center pr-2 font-bold cursor-pointer justify-self-end text-emerald-500 hover:text-emerald-800"
        onClick={onPress}
      >
        <p>{children}</p>
        {icon && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        )}
      </button>
    </>
  );
};

export default SelectButton;
