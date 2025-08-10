# FBR Digital Invoices - Development Rules

## 🎯 Project Context
This is a vanilla JavaScript web application for creating and managing FBR (Federal Board of Revenue) digital invoices in Pakistan. The application provides complete invoice management with real-time validation and FBR API integration.

## 🛠️ Technology Stack Rules
- **Use only vanilla JavaScript (ES6+)** - No frameworks or libraries except specified external ones
- **External libraries allowed**: jsPDF, QRCode.js, DOMPurify, Font Awesome
- **Storage**: Use IndexedDB for client-side data persistence
- **Styling**: CSS3 with Flexbox and Grid layouts only
- **HTML**: Semantic HTML5 markup

## 📁 File Structure Rules
- **Main files**: app.js (logic), index.html (markup), index.css (styles)
- **Assets**: Keep FBRDigitalInvoiceLogo.png in root
- **Build directory**: app/ is ignored, don't modify
- **Documentation**: Update README.md for major changes

## 🔧 Development Guidelines

### Code Style
- Write minimal, efficient code that directly addresses requirements
- Use modern ES6+ features (arrow functions, destructuring, async/await)
- Implement proper error handling for all API calls
- Follow consistent naming conventions (camelCase for variables/functions)

### API Integration Rules
- **Always validate data** before FBR API submission
- **Support dual environments**: Sandbox and Production modes
- **Handle API errors gracefully** with user-friendly messages
- **Required FBR endpoints**: validateinvoicedata, postinvoicedata, itemdesccode, provinces, transtypecode, uom, SaleTypeToRate, SroSchedule, statl

### Data Management
- **Use IndexedDB** for all client-side storage
- **Implement pagination** for large datasets
- **Provide search and filter** functionality
- **Support export/import** for data backup
- **Validate all inputs** before storage

### UI/UX Requirements
- **Responsive design** - must work on desktop, tablet, mobile
- **Dark/Light theme** support required
- **Toast notifications** for user feedback
- **Modal dialogs** for forms and data entry
- **Tab navigation** for organized interface

## 🔐 Security Rules
- **Use DOMPurify** for all HTML sanitization
- **Validate all user inputs** on client-side
- **Secure API token handling** - never expose in logs
- **Implement XSS protection** for all dynamic content

## 📋 Invoice Management Rules
- **Support all invoice types** and 28+ scenarios
- **Real-time validation** before submission
- **Draft system** - allow save/edit before submission
- **QR code generation** for all invoices
- **PDF export** functionality required
- **JSON viewer** for payload inspection

## 👥 Entity Management Rules
- **Seller Management**: NTN validation, API token configuration
- **Buyer Management**: Registration status verification
- **Product Database**: HS codes and tax rates required

## 🧪 Testing Rules
- **Built-in API testing** interface required
- **Test with Sandbox** environment first
- **Validate all FBR endpoints** before production use
- **Error handling testing** for all API failures

## 📱 Browser Compatibility
- **Minimum versions**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile support**: iOS Safari 13+, Chrome Mobile 80+
- **Progressive enhancement** approach

## 🚀 Performance Rules
- **Efficient data display** with pagination
- **Lazy loading** for large datasets
- **Minimize API calls** - cache responses when appropriate
- **Optimize for mobile** performance

## 🔄 Version Control Rules
- **Update version history** in README.md for releases
- **Test thoroughly** before commits
- **Document breaking changes**
- **Follow semantic versioning**

## 📝 Documentation Rules
- **Update README.md** for new features
- **Document API changes** and new endpoints
- **Maintain usage guide** accuracy
- **Keep roadmap updated**

## ⚠️ Critical Requirements
- **Valid FBR API credentials** required for functionality
- **Internet connection** needed for FBR API access
- **Local web server** required for development (no file:// protocol)
- **FBR compliance** - all invoices must meet FBR standards

## 🎨 UI Component Rules
- **Consistent styling** across all components
- **Accessible design** - proper ARIA labels and keyboard navigation
- **Loading states** for all async operations
- **Error states** with clear messaging
- **Success feedback** for completed actions

## 🔍 Code Review Checklist
- [ ] FBR API integration working correctly
- [ ] Input validation implemented
- [ ] Error handling in place
- [ ] Responsive design tested
- [ ] Security measures applied
- [ ] Performance optimized
- [ ] Documentation updated