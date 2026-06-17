interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
  }
  
  const SidebarItem = ({ icon, label, active, onClick }: SidebarItemProps) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors w-full text-left
        ${active
          ? 'bg-[#EDEAE2] text-[#2C2C2A] font-medium'
          : 'text-[#5F5E5A] hover:bg-[#F0EDE6]'
        }`}
    >
      {icon}
      {label}
    </button>
  );

  export default SidebarItem;