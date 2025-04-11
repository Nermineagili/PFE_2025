import React from 'react';
import CustomNavbar from '../components/navbar';
import Footer from '../components/Footer';
import { Outlet, useLocation, matchPath } from 'react-router-dom';

interface LayoutProps {
  scrollToAPropos?: () => void;
  scrollToClaimForm?: () => void;
  scrollToContactUs?: () => void;
  scrollToServices?: () => void;
  isHomePage?: boolean;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  scrollToAPropos,
  scrollToClaimForm,
  scrollToContactUs,
  scrollToServices,
  isHomePage = false,
  children
}) => {
  const location = useLocation();

  const excludedPaths = ['/signin', '/signup', '/adminhome', '/settings'];
  const shouldExclude =
    excludedPaths.includes(location.pathname) ||
    matchPath('/admin/edit-user/:id', location.pathname);

  return (
    <>
      {!shouldExclude && (
        <CustomNavbar
          scrollToAPropos={isHomePage ? scrollToAPropos : undefined}
          scrollToClaimForm={isHomePage ? scrollToClaimForm : undefined}
          scrollToContactUs={isHomePage ? scrollToContactUs : undefined}
          scrollToServices={isHomePage ? scrollToServices : undefined}
          isHomePage={isHomePage}
        />
      )}
      <main>{children || <Outlet />}</main>
      {!shouldExclude && <Footer />}
    </>
  );
};

export default Layout;
