import React from "react";
import Menu from "./Menu";
import MenuOption, { SubMenuOption } from "./MenuOption";

export type MenuItemType = {
  type: "menu" | "option";
  text: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  options?: SubMenuOption[];
};

interface SidebarMenuProps {
  items: MenuItemType[];
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidebarMenu = ({
  items,
  className = "",
  header,
  footer,
}: SidebarMenuProps) => {
  return (
    <div className={`w-[260px] min-h-screen flex flex-col bg-absolute-white border-r border-neutral-20 ${className}`}>
      {header && <div className="p-4">{header}</div>}

      <div className="flex-1 flex flex-col gap-2 p-4">
        {items.map((item, index) => {
          if (item.type === "menu") {
            return (
              <Menu
                key={index}
                text={item.text}
                icon={item.icon}
                isSelected={item.isSelected}
                onClick={item.onClick}
              />
            );
          } else {
            return (
              <MenuOption
                key={index}
                text={item.text}
                icon={item.icon}
                options={item.options}
              />
            );
          }
        })}
      </div>

      {footer && <div className="p-4 mt-auto">{footer}</div>}
    </div>
  );
};

export default SidebarMenu;
