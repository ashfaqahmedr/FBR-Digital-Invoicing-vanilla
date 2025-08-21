<<<<<<< HEAD
# FBR Digital Invoices - Vanilla

A comprehensive web application for creating and managing FBR (Federal Board of Revenue) digital invoices in Pakistan. This vanilla JavaScript application provides a complete solution for businesses to generate, validate, and submit invoices to the FBR system.

## 🚀 Features

### 📊 Dashboard Analytics
- **Business Overview**: Real-time statistics and key performance indicators
- **Invoice Analytics**: Track invoice counts, revenue, and submission rates
- **Visual Charts**: Interactive charts for sales trends and tax analysis
- **Performance Metrics**: Monitor API response times and success rates
- **Quick Actions**: Direct access to frequently used features

### 📋 Invoice Management
- **Create Digital Invoices**: Generate FBR-compliant invoices with real-time validation
- **Draft System**: Save invoices as drafts and edit before submission
- **Invoice Preview**: View invoices in PDF format before submission
- **Duplicate Invoices**: Create copies of existing invoices for quick processing
- **Invoice History**: Track all created invoices with status monitoring

### 👥 Entity Management
- **Seller Management**: Add, edit, and manage seller information with NTN validation
- **Buyer Management**: Maintain buyer database with registration status verification
- **Product Database**: Comprehensive product catalog with HS codes and tax rates

### 🔧 Advanced Features
- **Dual Environment Support**: Switch between Sandbox and Production modes
- **Real-time Validation**: Validate invoice data before submission
- **QR Code Generation**: Automatic QR code generation for invoices
- **PDF Export**: Generate professional PDF invoices
- **JSON Viewer**: View and copy invoice payloads in JSON format
- **API Testing**: Built-in API testing interface for FBR endpoints

### 📊 Data Management
- **IndexedDB Storage**: Client-side data persistence
- **Search & Filter**: Advanced filtering across all entities
- **Pagination**: Efficient data display with pagination
- **Sorting**: Multi-column sorting capabilities
- **Export/Import**: Data backup and restore functionality

### 🎨 User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes for better user experience
- **Toast Notifications**: Real-time feedback for user actions
- **Modal Dialogs**: Clean, organized forms and data entry
- **Tab Navigation**: Organized interface with multiple sections

## 🛠️ Technology Stack

### Frontend Technologies
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with Flexbox and Grid layouts
- **Vanilla JavaScript (ES6+)**: Modern JavaScript without frameworks
- **Font Awesome**: Icon library for enhanced UI
- **IndexedDB**: Client-side database for data persistence

### External Libraries
- **jsPDF**: PDF generation and export functionality
- **QRCode.js**: QR code generation for invoices
- **DOMPurify**: XSS protection and HTML sanitization

### APIs Integration
- **FBR Digital Invoice APIs**: Complete integration with Pakistan's FBR system
- **Real-time Validation**: Invoice validation before submission
- **Registration Verification**: NTN/CNIC validation services

## 📁 Project Structure

```
working/
├── app.js                    # Main application logic
├── index.html               # Main HTML file
├── index.css               # Stylesheet
├── FBRDigitalInvoiceLogo.png # Application logo
├── README.md               # Project documentation
├── .gitignore             # Git ignore rules
└── app/                   # Build directory (ignored)
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for FBR API access
- Valid FBR API tokens (Sandbox/Production)

### Installation
1. Clone or download the repository
2. Open `index.html` in a web browser
3. Configure seller information with valid API tokens
4. Start creating invoices!

### Configuration
1. **Add Sellers**: Navigate to "Manage Sellers" and add your business information
2. **API Tokens**: Enter your FBR Sandbox and Production tokens
3. **Add Buyers**: Set up your customer database
4. **Products**: Create a product catalog for quick invoice creation

## 📖 Usage Guide

### Creating an Invoice
1. Select seller and buyer from dropdowns
2. Choose invoice type and scenario
3. Add invoice items with HS codes and descriptions
4. Review totals and tax calculations
5. Submit to FBR or save as draft

### Managing Data
- **Sellers**: Add business information, API tokens, and scenario configurations
- **Buyers**: Maintain customer database with registration verification
- **Products**: Create reusable product templates with tax configurations
- **Invoices**: View, edit, duplicate, and track invoice status

### API Testing
- Test FBR endpoints directly from the application
- Validate API responses and troubleshoot issues
- Support for all major FBR API endpoints

## 🔐 Security Features

- **XSS Protection**: DOMPurify integration for safe HTML rendering
- **Input Validation**: Comprehensive client-side validation
- **Token Security**: Secure handling of API authentication tokens
- **Data Sanitization**: All user inputs are properly sanitized

## 🌐 FBR Integration

### Supported APIs
- **Invoice Validation**: `/validateinvoicedata`
- **Invoice Submission**: `/postinvoicedata`
- **HS Codes**: `/itemdesccode`
- **Provinces**: `/provinces`
- **Transaction Types**: `/transtypecode`
- **UOM (Unit of Measure)**: `/uom`
- **Tax Rates**: `/SaleTypeToRate`
- **SRO Schedules**: `/SroSchedule`
- **Registration Validation**: `/statl`

### Scenario Support
- 28+ predefined invoice scenarios
- Business activity and sector-based scenario filtering
- Automatic scenario assignment based on seller configuration

## 📱 Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+

## 🔧 Development

### Local Development
1. Serve files through a local web server (required for API calls)
2. Use browser developer tools for debugging
3. Test with FBR Sandbox environment first

### Customization
- Modify CSS variables for theme customization
- Extend JavaScript modules for additional functionality
- Add new API endpoints in the configuration section

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the FBR Digital Invoice documentation
- Review API endpoint responses in the testing section
- Ensure valid API tokens are configured

## 🔄 Version History

- **v1.0.0**: Initial release with core invoice functionality
- **v1.1.0**: Added product management and advanced filtering
- **v1.2.0**: Enhanced UI/UX with dark theme support
- **v1.3.0**: Improved PDF generation and QR code integration
- **v1.4.0**: Added Dashboard analytics with visual charts and KPIs

## 🎯 Roadmap

- [ ] Bulk invoice processing
- [ ] Email integration for invoice delivery
- [ ] Multi-language support
- [ ] Advanced tax calculation engine
- [ ] Integration with accounting software
- [ ] Export dashboard reports to PDF/Excel

---

=======
# FBR Digital Invoices - Vanilla

A comprehensive web application for creating and managing FBR (Federal Board of Revenue) digital invoices in Pakistan. This vanilla JavaScript application provides a complete solution for businesses to generate, validate, and submit invoices to the FBR system.

## 🚀 Features

### 📊 Dashboard Analytics
- **Business Overview**: Real-time statistics and key performance indicators
- **Invoice Analytics**: Track invoice counts, revenue, and submission rates
- **Visual Charts**: Interactive charts for sales trends and tax analysis
- **Performance Metrics**: Monitor API response times and success rates
- **Quick Actions**: Direct access to frequently used features

### 📋 Invoice Management
- **Create Digital Invoices**: Generate FBR-compliant invoices with real-time validation
- **Draft System**: Save invoices as drafts and edit before submission
- **Invoice Preview**: View invoices in PDF format before submission
- **Duplicate Invoices**: Create copies of existing invoices for quick processing
- **Invoice History**: Track all created invoices with status monitoring

### 👥 Entity Management
- **Seller Management**: Add, edit, and manage seller information with NTN validation
- **Buyer Management**: Maintain buyer database with registration status verification
- **Product Database**: Comprehensive product catalog with HS codes and tax rates

### 🔧 Advanced Features
- **Dual Environment Support**: Switch between Sandbox and Production modes
- **Real-time Validation**: Validate invoice data before submission
- **QR Code Generation**: Automatic QR code generation for invoices
- **PDF Export**: Generate professional PDF invoices
- **JSON Viewer**: View and copy invoice payloads in JSON format
- **API Testing**: Built-in API testing interface for FBR endpoints

### 📊 Data Management
- **IndexedDB Storage**: Client-side data persistence
- **Search & Filter**: Advanced filtering across all entities
- **Pagination**: Efficient data display with pagination
- **Sorting**: Multi-column sorting capabilities
- **Export/Import**: Data backup and restore functionality

### 🎨 User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes for better user experience
- **Toast Notifications**: Real-time feedback for user actions
- **Modal Dialogs**: Clean, organized forms and data entry
- **Tab Navigation**: Organized interface with multiple sections

## 🛠️ Technology Stack

### Frontend Technologies
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with Flexbox and Grid layouts
- **Vanilla JavaScript (ES6+)**: Modern JavaScript without frameworks
- **Font Awesome**: Icon library for enhanced UI
- **IndexedDB**: Client-side database for data persistence

### External Libraries
- **jsPDF**: PDF generation and export functionality
- **QRCode.js**: QR code generation for invoices
- **DOMPurify**: XSS protection and HTML sanitization

### APIs Integration
- **FBR Digital Invoice APIs**: Complete integration with Pakistan's FBR system
- **Real-time Validation**: Invoice validation before submission
- **Registration Verification**: NTN/CNIC validation services

## 📁 Project Structure

```
working/
├── app.js                    # Main application logic
├── index.html               # Main HTML file
├── index.css               # Stylesheet
├── FBRDigitalInvoiceLogo.png # Application logo
├── README.md               # Project documentation
├── .gitignore             # Git ignore rules
└── app/                   # Build directory (ignored)
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for FBR API access
- Valid FBR API tokens (Sandbox/Production)

### Installation
1. Clone or download the repository
2. Open `index.html` in a web browser
3. Configure seller information with valid API tokens
4. Start creating invoices!

### Configuration
1. **Add Sellers**: Navigate to "Manage Sellers" and add your business information
2. **API Tokens**: Enter your FBR Sandbox and Production tokens
3. **Add Buyers**: Set up your customer database
4. **Products**: Create a product catalog for quick invoice creation

## 📖 Usage Guide

### Creating an Invoice
1. Select seller and buyer from dropdowns
2. Choose invoice type and scenario
3. Add invoice items with HS codes and descriptions
4. Review totals and tax calculations
5. Submit to FBR or save as draft

### Managing Data
- **Sellers**: Add business information, API tokens, and scenario configurations
- **Buyers**: Maintain customer database with registration verification
- **Products**: Create reusable product templates with tax configurations
- **Invoices**: View, edit, duplicate, and track invoice status

### API Testing
- Test FBR endpoints directly from the application
- Validate API responses and troubleshoot issues
- Support for all major FBR API endpoints

## 🔐 Security Features

- **XSS Protection**: DOMPurify integration for safe HTML rendering
- **Input Validation**: Comprehensive client-side validation
- **Token Security**: Secure handling of API authentication tokens
- **Data Sanitization**: All user inputs are properly sanitized

## 🌐 FBR Integration

### Supported APIs
- **Invoice Validation**: `/validateinvoicedata`
- **Invoice Submission**: `/postinvoicedata`
- **HS Codes**: `/itemdesccode`
- **Provinces**: `/provinces`
- **Transaction Types**: `/transtypecode`
- **UOM (Unit of Measure)**: `/uom`
- **Tax Rates**: `/SaleTypeToRate`
- **SRO Schedules**: `/SroSchedule`
- **Registration Validation**: `/statl`

### Scenario Support
- 28+ predefined invoice scenarios
- Business activity and sector-based scenario filtering
- Automatic scenario assignment based on seller configuration

## 📱 Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile Browsers**: iOS Safari 13+, Chrome Mobile 80+

## 🔧 Development

### Local Development
1. Serve files through a local web server (required for API calls)
2. Use browser developer tools for debugging
3. Test with FBR Sandbox environment first

### Customization
- Modify CSS variables for theme customization
- Extend JavaScript modules for additional functionality
- Add new API endpoints in the configuration section

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the FBR Digital Invoice documentation
- Review API endpoint responses in the testing section
- Ensure valid API tokens are configured

## 🔄 Version History

- **v1.0.0**: Initial release with core invoice functionality
- **v1.1.0**: Added product management and advanced filtering
- **v1.2.0**: Enhanced UI/UX with dark theme support
- **v1.3.0**: Improved PDF generation and QR code integration
- **v1.4.0**: Added Dashboard analytics with visual charts and KPIs

## 🎯 Roadmap

- [ ] Bulk invoice processing
- [ ] Email integration for invoice delivery
- [ ] Multi-language support
- [ ] Advanced tax calculation engine
- [ ] Integration with accounting software
- [ ] Export dashboard reports to PDF/Excel

---

>>>>>>> 05a13451ecfa13932177f747648ee0ae9e40a23a
**Note**: This application requires valid FBR API credentials to function properly. Ensure you have the necessary permissions and tokens from the Federal Board of Revenue of Pakistan before using in production.