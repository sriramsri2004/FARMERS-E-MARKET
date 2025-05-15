
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  LogOut, 
  BellDot, 
  Bell,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from '@/components/ui/motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { useChat } from '@/contexts/ChatContext';
import NotificationList from './notifications/NotificationList';
import ChatDrawer from './chat/ChatDrawer';

const Navbar: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { unreadCount: unreadNotifications } = useNotifications();
  const { conversations } = useChat();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const unreadMessages = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="w-full py-4 px-6 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mt-3 mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <motion.div 
              className="bg-farmer-700 text-white p-2 rounded-md mr-2"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M21 12a9 9 0 0 0-9-9v9h9z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </motion.div>
            <span className="text-xl font-semibold text-gray-800 group-hover:text-farmer-700 transition-colors duration-300">
              Farmers E-Market
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            {profile ? (
              <>
                {profile.role === 'farmer' ? (
                  <NavLink to="/products" label="My Products" />
                ) : (
                  <NavLink to="/market" label="Market" />
                )}
                <NavLink to="/prices" label="Live Prices" />
                
                <div className="flex items-center gap-4">
                  {/* Chat Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsChatOpen(true)}
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-300"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                  
                  {/* Notifications */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-gray-600 hover:text-gray-900 transition-colors duration-300"
                        >
                          {unreadNotifications > 0 ? (
                            <BellDot className="h-5 w-5" />
                          ) : (
                            <Bell className="h-5 w-5" />
                          )}
                          {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Notifications</h3>
                            {unreadNotifications > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {unreadNotifications} new
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ScrollArea className="h-80">
                          <NotificationList />
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                
                  <Link to="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        className={`rounded-full px-4 py-2 ${profile.role === 'farmer' ? 'bg-farmer-700 hover:bg-farmer-800' : 'bg-amber-700 hover:bg-amber-800'} transition-all duration-300`}
                      >
                        {profile.full_name}
                      </Button>
                    </motion.div>
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-300"
                    >
                      <LogOut className="h-5 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" className="border-farmer-600 text-farmer-700 hover:bg-farmer-50 transition-all duration-300">
                      Login
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/register">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-farmer-700 hover:bg-farmer-800 transition-all duration-300">
                      Register
                    </Button>
                  </motion.div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Chat Drawer */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </motion.div>
  );
};

// Animated NavLink component
const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link to={to} className="relative group">
    <span className="text-gray-700 group-hover:text-farmer-700 transition-colors duration-300">
      {label}
    </span>
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-farmer-700 group-hover:w-full transition-all duration-300" />
  </Link>
);

export default Navbar;
