interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
    badge?: number;
  }
  
  const SidebarItem = ({ icon, label, active, onClick, badge }: SidebarItemProps) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors w-full text-left hover:cursor-pointer 
        ${active
          ? 'bg-[#EDEAE2] text-[#2C2C2A] font-medium'
          : 'text-[#5F5E5A] hover:bg-[#F0EDE6]'
        }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#2C2C2A] text-[#F7F5F0] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );

  export default SidebarItem;