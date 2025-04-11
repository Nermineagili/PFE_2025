import React from 'react';
import CustomNavbar from '../components/navbar';
import Footer from '../components/Footer';
import { Outlet, useLocation } from 'react-router-dom';

interface LayoutProps {
    scrollToAPropos?: () => void;
    scrollToClaimForm?: () => void;
    scrollToContactUs?: () => void;
    scrollToServices?: () => void;
    isHomePage?: boolean;
    children?: React.ReactNode; // Add this line
  }

  const Layout: React.FC<LayoutProps> = ({
    scrollToAPropos,
    scrollToClaimForm,
    scrollToContactUs,
    scrollToServices,
    isHomePage = false,
    children // Add this prop
  }) => {
    const location = useLocation();
  
    // Define routes where Navbar and Footer should be hidden
    const excludedRoutes = ['/signin', '/signup', '/adminhome', '/settings', '/admin/edit-user/:id'];
    const shouldShowNavAndFooter = !excludedRoutes.includes(location.pathname);
  
    return (
      <>
        {shouldShowNavAndFooter && (
          <CustomNavbar
            scrollToAPropos={isHomePage ? scrollToAPropos : undefined}
            scrollToClaimForm={isHomePage ? scrollToClaimForm : undefined}
            scrollToContactUs={isHomePage ? scrollToContactUs : undefined}
            scrollToServices={isHomePage ? scrollToServices : undefined}
            isHomePage={isHomePage}
          />
        )}
        <main style={{ paddingTop: shouldShowNavAndFooter ? '70px' : '0' }}>
          {children || <Outlet />} {/* Render either children or Outlet */}
        </main>
        {shouldShowNavAndFooter && <Footer />}
      </>
    );
  };

export default Layout;