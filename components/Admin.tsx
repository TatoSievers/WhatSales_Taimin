
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { Product, NewProduct, Order } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CloseIcon from './icons/CloseIcon';
import { formatCurrency, getOrders, updateOrder, deleteOrder, isPromoActive } from '../utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
// FIX: Corrected date-fns imports to use named imports from the main package. This resolves the "not callable" error on `endOfDay`, which likely stemmed from using an incompatible import syntax with the installed version of date-fns.
import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

// --- DASHBOARD COMPONENTS --- //

const DollarSignIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 8v1m0-6v1m0 6v1M6 6h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
);

const ShoppingBagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" />
    </svg>
);

const KpiCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center space-x-4">
        <div className="bg-primary-100 p-4 rounded-full">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const Dashboard = ({ orders, products }: { orders: Order[], products: Product[] }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const filteredOrders = useMemo(() => {
        if (!startDate || !endDate) return orders;
        const start = startOfDay(parseISO(startDate));
        const end = endOfDay(parseISO(endDate));
        return orders.filter(order => {
            const orderDate = parseISO(order.date);
            return orderDate >= start && orderDate <= end;
        });
    }, [orders, startDate, endDate]);

    const kpiData = useMemo(() => {
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const uniqueCustomers = new Set(filteredOrders.map(order => order.customer.cpf)).size;
        return { totalRevenue, totalOrders, averageOrderValue, uniqueCustomers };
    }, [filteredOrders]);
    
    const chartData = useMemo(() => {
        // Sales over Time
        const salesByDay = filteredOrders.reduce((acc, order) => {
            const day = startOfDay(parseISO(order.date)).toISOString();
            acc[day] = (acc[day] || 0) + order.totalPrice;
            return acc;
        }, {} as Record<string, number>);

        const sortedDays = Object.keys(salesByDay).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

        const salesOverTimeData = {
            labels: sortedDays,
            datasets: [{
                label: 'Receita',
                data: sortedDays.map(day => salesByDay[day]),
                borderColor: '#15803d',
                backgroundColor: 'rgba(21, 128, 61, 0.1)',
                fill: true,
                tension: 0.3,
            }]
        };

        // Top Selling Products
        const productSales = filteredOrders
            .flatMap(o => o.items)
            .reduce((acc, item) => {
                acc[item.name] = (acc[item.name] || 0) + item.quantity;
                return acc;
            }, {} as Record<string, number>);
        
        const topProducts = Object.entries(productSales)
            .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
            .slice(0, 10);

        const topProductsData = {
            labels: topProducts.map(([name]) => name),
            datasets: [{
                label: 'Unidades Vendidas',
                data: topProducts.map(([, qty]) => qty),
                backgroundColor: '#22c55e',
                borderColor: '#16a34a',
                borderWidth: 1,
            }]
        };

        return { salesOverTimeData, topProductsData };
    }, [filteredOrders, products]);
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Gerencial</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <label className="font-semibold text-gray-700">Filtrar por Período:</label>
                <div className="flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white" />
                    <span className="text-gray-600">até</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KpiCard title="Receita Total" value={formatCurrency(kpiData.totalRevenue)} icon={<DollarSignIcon />} />
                <KpiCard title="Total de Pedidos" value={kpiData.totalOrders} icon={<ShoppingBagIcon />} />
                <KpiCard title="Ticket Médio" value={formatCurrency(kpiData.averageOrderValue)} icon={<DollarSignIcon />} />
                <KpiCard title="Clientes Únicos" value={kpiData.uniqueCustomers} icon={<UsersIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-96">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Vendas ao Longo do Tempo</h3>
                    <Line data={chartData.salesOverTimeData} options={{...chartOptions, scales: { x: { type: 'time', time: { unit: 'day', displayFormats: { day: 'dd/MM' } }, adapters: { date: { locale: ptBR } } } } }} />
                </div>
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-96">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Produtos Mais Vendidos</h3>
                    <Bar data={chartData.topProductsData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
                </div>
            </div>
        </div>
    );
};

// --- END DASHBOARD --- //

const initialFormState: NewProduct = {
  name: '',
  price: 0,
  promoPrice: 0,
  promoEndDate: '',
  category: 'Fórmulas Magistrais Chinesas',
  imageUrl: '',
  quantityInfo: '',
  action: '',
  indication: '',
  visibility: 'in_stock',
};

const Admin: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct: deleteProductFromContext, loading } = useProducts();
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [formData, setFormData] = useState<NewProduct>(initialFormState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  // Product Filters State
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productFilterCategory, setProductFilterCategory] = useState('all');
  const [productFilterVisibility, setProductFilterVisibility] = useState('all');
  
  // Order Filters State
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState<'all' | 'open' | 'completed'>('all');
  const [orderFilterCustomerStatus, setOrderFilterCustomerStatus] = useState<'all' | 'pending' | 'registered'>('all');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');

  // Order Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // TXT Export Modal State
  const [isTxtExportModalOpen, setIsTxtExportModalOpen] = useState(false);
  const [txtExportContent, setTxtExportContent] = useState('');
  const [copySuccess, setCopySuccess] = useState('');

  const observationUpdateTimers = useRef<{ [key: string]: number }>({});
  
  const fetchOrders = useCallback(async () => {
    const ordersFromDb = await getOrders();
    setOrders(ordersFromDb);
  }, []);

  useEffect(() => {
    fetchOrders();
    return () => {
        Object.values(observationUpdateTimers.current).forEach(clearTimeout);
    };
  }, [fetchOrders]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: isEditing.name,
        price: isEditing.price,
        promoPrice: isEditing.promoPrice || 0,
        promoEndDate: isEditing.promoEndDate ? isEditing.promoEndDate.split('T')[0] : '',
        category: isEditing.category,
        imageUrl: isEditing.imageUrl,
        quantityInfo: isEditing.quantityInfo || '',
        action: isEditing.action || '',
        indication: isEditing.indication || '',
        visibility: isEditing.visibility || 'in_stock',
      });
      setFormErrors({});
      // Find the form and scroll to it
      const formElement = document.getElementById('product-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setFormData(initialFormState);
    }
  }, [isEditing]);
  
  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = "Nome do produto é obrigatório.";
    if (!formData.category.trim()) errors.category = "Categoria é obrigatória.";
    if (formData.price <= 0) errors.price = "O preço deve ser maior que zero.";
    if (!formData.imageUrl.trim()) {
      errors.imageUrl = "URL da imagem é obrigatória.";
    } else {
      try {
        new URL(formData.imageUrl);
      } catch (_) {
        errors.imageUrl = "Por favor, insira uma URL válida.";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'promoPrice' ? parseFloat(value) || 0 : value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setIsEditing(null);
    setFormErrors({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const productData = {
      ...formData,
      name: formData.name.toUpperCase(),
      promoPrice: formData.promoPrice && formData.promoPrice > 0 ? formData.promoPrice : null,
      promoEndDate: formData.promoEndDate || null,
    };

    if (isEditing) {
      await updateProduct(isEditing.id, productData);
      setSuccessMessage('Produto atualizado com sucesso!');
    } else {
      await addProduct(productData);
      setSuccessMessage('Produto adicionado com sucesso!');
    }
    resetForm();
  };
  
  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
        await deleteProductFromContext(id);
        setSuccessMessage('Produto excluído com sucesso!');
        if (isEditing && isEditing.id === id) {
          resetForm();
        }
    }
  };

  const handleOrderUpdate = useCallback(async (orderId: string, updatedFields: Partial<Order>) => {
    const orderToSave = orders.find(o => o.id === orderId);
    if(orderToSave){
        const updatedOrder = {...orderToSave, ...updatedFields};
        await updateOrder(updatedOrder);
        setSuccessMessage(`Pedido de ${updatedOrder.customer.name} atualizado.`);
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    }
  }, [orders]);
  
  const handleObservationChange = (orderId: string, value: string) => {
    setOrders(currentOrders => 
        currentOrders.map(o => 
            o.id === orderId ? { ...o, observation: value } : o
        )
    );
    if (observationUpdateTimers.current[orderId]) {
        clearTimeout(observationUpdateTimers.current[orderId]);
    }
    observationUpdateTimers.current[orderId] = window.setTimeout(() => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            updateOrder(order);
        }
    }, 700);
  };

  const handleVisibilityChange = async (productId: number, newVisibility: Product['visibility']) => {
    await updateProduct(productId, { visibility: newVisibility });
    const productName = products.find(p => p.id === productId)?.name || 'Produto';
    setSuccessMessage(`Visibilidade de '${productName}' atualizada.`);
  };
  
  const openDeleteModal = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    const adminPassword = (import.meta as any).env.VITE_ADMIN_PASSWORD;

    if (deletePassword !== adminPassword) {
        setDeleteError('Senha incorreta.');
        return;
    }
    try {
        await deleteOrder(orderToDelete.id);
        setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));
        setSuccessMessage('Pedido excluído com sucesso!');
        setIsDeleteModalOpen(false);
        setOrderToDelete(null);
    } catch (error) {
        setDeleteError('Falha ao excluir o pedido.');
    }
  };

  const baseInputClass = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-800 placeholder-gray-500";
  const errorInputClass = "border-red-500 ring-1 ring-red-500";
  const errorTextClass = "text-red-600 text-sm mt-1";
  
  const duplicateOrderIds = useMemo(() => {
    const seenOrders = new Map<string, string>(); // Map<compositeKey, firstOrderId>
    const duplicates = new Set<string>();

    // Sort orders by date to ensure the first one encountered is the original
    const sortedOrders = [...orders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const order of sortedOrders) {
      const itemsKey = order.items
        .map(item => `${item.id}:${item.quantity}`)
        .sort()
        .join(',');
      const compositeKey = `${order.customer.cpf}|${order.totalPrice}|${itemsKey}`;

      if (seenOrders.has(compositeKey)) {
        duplicates.add(order.id);
      } else {
        seenOrders.set(compositeKey, order.id);
      }
    }
    return duplicates;
  }, [orders]);

  useEffect(() => {
    const duplicateText = '(PEDIDO DUPLICADO)';
    const ordersThatNeedUpdate = orders.filter(order => 
        duplicateOrderIds.has(order.id) && !order.observation.startsWith(duplicateText)
    );

    if (ordersThatNeedUpdate.length > 0) {
      const updatedOrdersMap = new Map<string, Order>();
      ordersThatNeedUpdate.forEach(order => {
        const newObservation = order.observation ? `${duplicateText} ${order.observation}` : duplicateText;
        const updatedOrder = { ...order, observation: newObservation };
        updatedOrdersMap.set(order.id, updatedOrder);
      });

      setOrders(currentOrders =>
        currentOrders.map(o => updatedOrdersMap.get(o.id) || o)
      );
      
      updatedOrdersMap.forEach(updatedOrder => {
        updateOrder(updatedOrder);
      });
    }
  }, [duplicateOrderIds, orders, updateOrder]);


  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        const searchTermLower = orderSearchTerm.toLowerCase();
        const matchesSearch = orderSearchTerm === '' ||
            order.customer.name.toLowerCase().includes(searchTermLower) ||
            order.customer.cpf.replace(/\D/g, '').includes(searchTermLower.replace(/\D/g, '')) ||
            order.customer.email.toLowerCase().includes(searchTermLower);

        const matchesStatus = orderFilterStatus === 'all' || order.status === orderFilterStatus;

        const matchesCustomerStatus = orderFilterCustomerStatus === 'all' || order.customerStatus === orderFilterCustomerStatus;

        const orderDate = parseISO(order.date);
        const matchesStartDate = !orderStartDate || orderDate >= startOfDay(parseISO(orderStartDate));
        const matchesEndDate = !orderEndDate || orderDate <= endOfDay(parseISO(orderEndDate));
        
        return matchesSearch && matchesStatus && matchesCustomerStatus && matchesStartDate && matchesEndDate;
    });
  }, [orders, orderSearchTerm, orderFilterStatus, orderFilterCustomerStatus, orderStartDate, orderEndDate]);
  
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.text("Relatório de Pedidos - Taimin", 14, 16);

    const tableColumn = ["Data", "Cliente", "CPF", "Produto", "Qtd", "Preço Unit.", "Subtotal", "Status Venda"];
    const tableRows: any[][] = [];

    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const rowData = [
                new Date(order.date).toLocaleDateString('pt-BR'),
                order.customer.name,
                order.customer.cpf,
                item.name,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.price * item.quantity),
                order.status === 'completed' ? 'Concluída' : 'Aberto'
            ];
            tableRows.push(rowData);
        });
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 84, 61] }, // Cor primária
    });

    doc.save('relatorio_pedidos_taimin.pdf');
  }, [filteredOrders]);

  const exportToExcel = useCallback(() => {
    const flattenedData = filteredOrders.flatMap(order => 
        order.items.map(item => ({
            'ID Pedido': order.id,
            'Data': new Date(order.date).toLocaleString('pt-BR'),
            'Cliente': order.customer.name,
            'CPF': order.customer.cpf,
            'Email': order.customer.email,
            'Status Cadastro': order.customerStatus === 'registered' ? 'Realizado' : 'Pendente',
            'Status Venda': order.status === 'completed' ? 'Concluída' : 'Aberto',
            'Observação': order.observation,
            'ID Produto': item.id,
            'Produto': item.name,
            'Categoria': item.category,
            'Quantidade': item.quantity,
            'Preço Unitário': item.price,
            'Subtotal Item': item.price * item.quantity,
            'Total Pedido': order.totalPrice
        }))
    );

    if (flattenedData.length === 0) {
        alert("Não há dados de pedidos para exportar com os filtros atuais.");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');
    
    const headerKeys = Object.keys(flattenedData[0] || {});
    const colWidths = headerKeys.map(key => ({
        wch: Math.max(
            key.length,
            ...flattenedData.map(row => (row[key as keyof typeof row] || '').toString().length)
        ) + 2
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'relatorio_pedidos_taimin.xlsx');
  }, [filteredOrders]);

  const openTxtExportModal = useCallback(() => {
    const fileContent = filteredOrders.map(order => {
        const itemsText = order.items.map(i => `- ${i.quantity}x ${i.name.toUpperCase()} (${formatCurrency(i.price * i.quantity)})`).join('\n');
        const customerStatusText = order.customerStatus === 'registered' ? 'Realizado' : 'Pendente';
        const orderStatusText = order.status === 'completed' ? 'Concluída' : 'Aberto';
        const observationText = order.observation || 'Nenhuma';
        const orderDate = new Date(order.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `*Pedido de: ${order.customer.name}*
*CPF:* ${order.customer.cpf}
*Data:* ${orderDate}

*Itens do Pedido:*
${itemsText}

*Total:* ${formatCurrency(order.totalPrice)}
*Status Cadastro:* ${customerStatusText}
*Status Venda:* ${orderStatusText}
*Observação:* ${observationText}
---------------------------------------`;
    }).join('\n\n');
    
    setTxtExportContent(fileContent);
    setIsTxtExportModalOpen(true);
  }, [filteredOrders]);

  const handleCopyTxt = useCallback(() => {
    if (txtExportContent) {
      navigator.clipboard.writeText(txtExportContent);
      setCopySuccess('Texto copiado com sucesso!');
    }
  }, [txtExportContent]);

  const productCategories = useMemo(() => ['all', ...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
      const matchesCategory = productFilterCategory === 'all' || product.category === productFilterCategory;
      const matchesVisibility = productFilterVisibility === 'all' || product.visibility === productFilterVisibility;
      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [products, productSearchTerm, productFilterCategory, productFilterVisibility]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Painel do Administrador</h1>
        <p className="text-gray-600">Gerencie os produtos e pedidos da sua loja.</p>
      </div>

      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-sm" role="alert">
          <p className="font-bold">{successMessage}</p>
        </div>
      )}

      <Dashboard orders={orders} products={products} />

      {/* Orders Report */}
      <div className="mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Relatório de Pedidos</h2>
          <div className="flex items-center space-x-2 flex-wrap justify-center">
            <button onClick={exportToPDF} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm">Exportar PDF</button>
            <button onClick={exportToExcel} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm">Exportar Excel</button>
            <button onClick={openTxtExportModal} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">Exportar TXT (WhatsApp)</button>
          </div>
        </div>

        {/* Order Filters */}
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Filtrar Pedidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Buscar por cliente, CPF, email..."
                    value={orderSearchTerm}
                    onChange={e => setOrderSearchTerm(e.target.value)}
                    className={`${baseInputClass} md:col-span-2 lg:col-span-1`}
                />
                <select
                    value={orderFilterStatus}
                    onChange={e => setOrderFilterStatus(e.target.value as any)}
                    className={baseInputClass}
                >
                    <option value="all">Todos Status Venda</option>
                    <option value="open">Aberto</option>
                    <option value="completed">Concluída</option>
                </select>
                <select
                    value={orderFilterCustomerStatus}
                    onChange={e => setOrderFilterCustomerStatus(e.target.value as any)}
                    className={baseInputClass}
                >
                    <option value="all">Todos Status Cadastro</option>
                    <option value="pending">Pendente</option>
                    <option value="registered">Realizado</option>
                </select>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={orderStartDate} 
                        onChange={e => setOrderStartDate(e.target.value)} 
                        className={baseInputClass}
                        aria-label="Data de início"
                    />
                    <span className="text-gray-600">até</span>
                    <input 
                        type="date" 
                        value={orderEndDate} 
                        onChange={e => setOrderEndDate(e.target.value)} 
                        className={baseInputClass}
                        aria-label="Data de fim"
                    />
                </div>
            </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
           <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3">Data</th>
                        <th scope="col" className="px-4 py-3">Cliente</th>
                        <th scope="col" className="px-4 py-3">CPF</th>
                        <th scope="col" className="px-4 py-3">Produtos</th>
                        <th scope="col" className="px-4 py-3 text-right">Valor Total</th>
                        <th scope="col" className="px-4 py-3 text-center">Status Cadastro</th>
                        <th scope="col" className="px-4 py-3 text-center">Status Venda</th>
                        <th scope="col" className="px-4 py-3">Observação</th>
                        <th scope="col" className="px-4 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => {
                            const isDuplicate = duplicateOrderIds.has(order.id);
                        
                            return (
                                <tr key={order.id} className={`border-b ${isDuplicate ? 'bg-yellow-100 hover:bg-yellow-200 relative duplicate-watermark' : 'bg-white hover:bg-gray-50'}`}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {new Date(order.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {order.customer.name}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">{order.customer.cpf}</td>
                                    <td className="px-4 py-4">
                                      <ul className="list-disc list-inside">
                                        {order.items.map(item => <li key={item.id}>{item.name} ({item.quantity}x)</li>)}
                                      </ul>
                                    </td>
                                    <td className="px-4 py-4 text-right font-medium">
                                        {formatCurrency(order.totalPrice)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                       <select
                                            value={order.customerStatus}
                                            onChange={e => handleOrderUpdate(order.id, { customerStatus: e.target.value as Order['customerStatus'] })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="pending">Pendente</option>
                                            <option value="registered">Realizado</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <label className="flex items-center justify-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                          checked={order.status === 'completed'}
                                          onChange={e => handleOrderUpdate(order.id, { status: e.target.checked ? 'completed' : 'open' })}
                                          title={order.status === 'completed' ? 'Marcar como Em Aberto' : 'Marcar como Concluída'}
                                        />
                                        <span className={`ml-2 text-xs font-semibold ${order.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                                          {order.status === 'completed' ? 'Concluída' : 'Aberto'}
                                        </span>
                                      </label>
                                    </td>
                                    <td className="px-4 py-4">
                                      <input
                                        type="text"
                                        value={order.observation}
                                        onChange={e => handleObservationChange(order.id, e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Adicionar nota..."
                                      />
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <button 
                                        onClick={() => openDeleteModal(order)}
                                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                                        aria-label={`Excluir pedido de ${order.customer.name}`}
                                        title="Excluir Pedido"
                                      >
                                        <TrashIcon />
                                      </button>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan={9} className="text-center text-gray-500 py-8">
                                Nenhum pedido encontrado. Tente ajustar seus filtros.
                            </td>
                        </tr>
                    )}
                </tbody>
                 {filteredOrders.length > 0 && (
                    <tfoot className="bg-gray-50 font-semibold">
                         <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-gray-800 uppercase">Total (Filtrado)</td>
                            <td className="px-4 py-3 text-right text-gray-900">
                                {formatCurrency(filteredOrders.reduce((acc, order) => acc + order.totalPrice, 0))}
                            </td>
                            <td colSpan={4}></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
      </div>
      
      {/* Product Form */}
      <div id="product-form" className="bg-white p-6 rounded-lg shadow-md border border-gray-200 scroll-mt-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={`${baseInputClass} ${formErrors.name ? errorInputClass : 'border-gray-300'}`} />
              {formErrors.name && <p className={errorTextClass}>{formErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input type="text" name="category" id="category" value={formData.category} onChange={handleInputChange} className={`${baseInputClass} ${formErrors.category ? errorInputClass : 'border-gray-300'}`} />
              {formErrors.category && <p className={errorTextClass}>{formErrors.category}</p>}
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço Padrão (R$)</label>
              <input type="number" name="price" id="price" value={formData.price} onChange={handleInputChange} className={`${baseInputClass} ${formErrors.price ? errorInputClass : 'border-gray-300'}`} step="0.01" min="0" />
              {formErrors.price && <p className={errorTextClass}>{formErrors.price}</p>}
            </div>
             <div>
              <label htmlFor="quantityInfo" className="block text-sm font-medium text-gray-700 mb-1">Informação de Quantidade</label>
              <input type="text" name="quantityInfo" id="quantityInfo" value={formData.quantityInfo || ''} onChange={handleInputChange} className={`${baseInputClass} border-gray-300`} placeholder="Ex: 180 cápsulas" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
              <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className={`${baseInputClass} ${formErrors.imageUrl ? errorInputClass : 'border-gray-300'}`} placeholder="https://exemplo.com/imagem.jpg" />
              {formErrors.imageUrl && <p className={errorTextClass}>{formErrors.imageUrl}</p>}
            </div>
             <div className="md:col-span-2 p-4 bg-primary-50 rounded-lg border border-primary-200 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label htmlFor="promoPrice" className="block text-sm font-medium text-primary-800 mb-1">Preço Promocional (R$)</label>
                  <input type="number" name="promoPrice" id="promoPrice" value={formData.promoPrice || ''} onChange={handleInputChange} className={`${baseInputClass}`} step="0.01" min="0" placeholder="Deixe 0 para não aplicar" />
                </div>
                <div>
                  <label htmlFor="promoEndDate" className="block text-sm font-medium text-primary-800 mb-1">Data de Validade da Promoção</label>
                  <input type="date" name="promoEndDate" id="promoEndDate" value={formData.promoEndDate || ''} onChange={handleInputChange} className={`${baseInputClass}`} />
                </div>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">Ação</label>
                <textarea name="action" id="action" value={formData.action || ''} onChange={handleInputChange} rows={3} className={`${baseInputClass} border-gray-300`}></textarea>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="indication" className="block text-sm font-medium text-gray-700 mb-1">Indicação</label>
                <textarea name="indication" id="indication" value={formData.indication || ''} onChange={handleInputChange} rows={3} className={`${baseInputClass} border-gray-300`}></textarea>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibilidade na Loja</label>
              <select name="visibility" id="visibility" value={formData.visibility} onChange={handleInputChange} className={`${baseInputClass} border-gray-300`}>
                <option value="in_stock">Em Estoque (Visível)</option>
                <option value="out_of_stock">Esgotado (Visível com aviso)</option>
                <option value="hidden">Não Exibir (Oculto da loja)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4 pt-2">
            <button type="submit" className="bg-primary-700 text-white font-bold py-2 px-6 rounded-md hover:bg-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              {isEditing ? 'Atualizar Produto' : 'Adicionar Produto'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-md hover:bg-gray-300 transition-colors">
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista de Produtos</h2>
        
        {/* Filters */}
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={productSearchTerm}
              onChange={e => setProductSearchTerm(e.target.value)}
              className={baseInputClass}
            />
            <select
              value={productFilterCategory}
              onChange={e => setProductFilterCategory(e.target.value)}
              className={baseInputClass}
            >
              {productCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'Todas as Categorias' : cat}</option>
              ))}
            </select>
            <select
              value={productFilterVisibility}
              onChange={e => setProductFilterVisibility(e.target.value as any)}
              className={baseInputClass}
            >
              <option value="all">Toda a Visibilidade</option>
              <option value="in_stock">Em Estoque</option>
              <option value="out_of_stock">Esgotado</option>
              <option value="hidden">Oculto</option>
            </select>
          </div>
        </div>

        {loading ? (
            <p className="text-gray-500">Carregando produtos...</p>
        ) : (
            <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3">Produto</th>
                    <th scope="col" className="px-6 py-3">Categoria</th>
                    <th scope="col" className="px-6 py-3">Visibilidade</th>
                    <th scope="col" className="px-6 py-3">Preço Padrão</th>
                    <th scope="col" className="px-6 py-3">Promoção Ativa</th>
                    <th scope="col" className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                           <img src={product.imageUrl} alt={product.name} className={`w-10 h-10 rounded-md object-contain bg-gray-200 ${product.visibility === 'out_of_stock' ? 'opacity-40' : ''}`} />
                           <div>
                            <span className="font-semibold">{product.name}</span>
                            {product.quantityInfo && <p className="text-xs text-gray-500">{product.quantityInfo}</p>}
                           </div>
                        </div>
                      </th>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4">
                        <select
                          value={product.visibility}
                          onChange={(e) => handleVisibilityChange(product.id, e.target.value as Product['visibility'])}
                          className="w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="in_stock">Em Estoque</option>
                            <option value="out_of_stock">Esgotado</option>
                            <option value="hidden">Oculto</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4">
                        {isPromoActive(product) && product.promoPrice ? (
                          <div>
                            <span className="font-bold text-red-600">{formatCurrency(product.promoPrice)}</span>
                            {product.promoEndDate && <p className="text-xs text-gray-500">Expira: {new Date(product.promoEndDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-3">
                          <button onClick={() => setIsEditing(product)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors" aria-label={`Editar ${product.name}`}>
                            <EditIcon />
                          </button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors" aria-label={`Excluir ${product.name}`}>
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum produto encontrado com os filtros atuais.</p>}
            </div>
        )}
      </div>

      {/* Modals */}
      {isDeleteModalOpen && orderToDelete && ( <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full text-left transform transition-all relative">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmar Exclusão</h2>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja excluir permanentemente o pedido de <strong>{orderToDelete.customer.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Para confirmar, digite a senha de administrador:
                    </label>
                    <input
                        type="password"
                        id="deletePassword"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    {deleteError && <p className="text-red-600 text-sm mt-1">{deleteError}</p>}
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button onClick={handleConfirmDelete} className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">
                        Excluir Pedido
                    </button>
                </div>
            </div>
          </div>
        </div>)}
      
      {isTxtExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-2xl w-full text-left transform transition-all relative">
            <button onClick={() => setIsTxtExportModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Fechar">
              <CloseIcon />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Exportar para WhatsApp</h2>
            <div className="bg-gray-100 p-4 rounded-md max-h-80 overflow-y-auto border border-gray-200 mb-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">{txtExportContent || 'Nenhum pedido para exportar com os filtros atuais.'}</pre>
            </div>
            <div className="flex justify-end items-center gap-4">
              <span className={`text-green-600 font-semibold transition-opacity duration-300 ${copySuccess ? 'opacity-100' : 'opacity-0'}`}>
                {copySuccess}
              </span>
              <button onClick={handleCopyTxt} className="bg-primary-700 text-white font-bold py-2 px-6 rounded-md hover:bg-primary-800 transition-colors disabled:bg-gray-400" disabled={!txtExportContent}>
                Copiar Texto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
