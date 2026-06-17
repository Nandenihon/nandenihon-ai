import React from "react";
import { Left, Right, DotMenu } from "../icons";

interface StepperProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Stepper = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: StepperProps) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Reduced for simpler logic, usually 5 or 7

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic with dots
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "dot", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "dot", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "dot", currentPage, "dot", totalPages);
      }
    }

    return pages.map((page, index) => {
      if (page === "dot") {
        return (
          <div key={`dot-${index}`} className="flex items-center justify-center w-8 h-8">
             <DotMenu colorMode="custom" className="text-neutral-90" />
          </div>
        );
      }

      const isSelected = page === currentPage;
      
      const baseStyles = "flex items-center justify-center w-8 h-8 text-sm font-bold rounded cursor-pointer transition-colors";
      const defaultState = "text-neutral-90 hover:bg-primary-40";
      const selectedState = "bg-primary-base text-absolute-white hover:bg-primary-base";

      return (
        <button
          key={page}
          onClick={() => handlePageChange(page as number)}
          className={`${baseStyles} ${isSelected ? selectedState : defaultState}`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={isFirstPage}
        className={`p-2 rounded-full transition-colors ${
          isFirstPage ? "text-neutral-30 cursor-not-allowed" : "text-neutral-90 hover:bg-neutral-10 cursor-pointer"
        }`}
      >
        <Left colorMode="custom" className={isFirstPage ? "text-neutral-30" : "text-neutral-90"} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={isLastPage}
        className={`p-2 rounded-full transition-colors ${
          isLastPage ? "text-neutral-30 cursor-not-allowed" : "text-neutral-90 hover:bg-neutral-10 cursor-pointer"
        }`}
      >
        <Right colorMode="custom" className={isLastPage ? "text-neutral-30" : "text-neutral-90"} />
      </button>
    </div>
  );
};

export default Stepper;
