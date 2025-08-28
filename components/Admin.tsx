
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useProducts } from '../context/ProductContext';
import { Product, NewProduct, Order } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency, getOrders, updateOrder, deleteOrder } from '../utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


const initialFormState: NewProduct = {
  name: '',
  price: 0,
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const observationUpdateTimers = useRef<{ [key: string]: number }>({});
  
  const fetchOrders = useCallback(async () => {
    const ordersFromDb = await getOrders();
    setOrders(ordersFromDb);
  }, []);

  useEffect(() => {
    fetchOrders();
    // Clear all timers when the component unmounts
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
    if (isEditing) {
      setFormData({
        name: isEditing.name,
        price: isEditing.price,
        category: isEditing.category,
        imageUrl: isEditing.imageUrl,
        quantityInfo: isEditing.quantityInfo || '',
        action: isEditing.action || '',
        indication: isEditing.indication || '',
        visibility: isEditing.visibility || 'in_stock',
      });
      setFormErrors({});
      window.scrollTo(0, 0);
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
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (name === 'price' ? parseFloat(value) || 0 : value)
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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

    if (isEditing) {
      await updateProduct({ ...isEditing, ...formData, name: formData.name.toUpperCase() });
      setSuccessMessage('Produto atualizado com sucesso!');
    } else {
      await addProduct({ ...formData, name: formData.name.toUpperCase() });
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
        // Re-fetch to ensure data consistency, or update local state carefully
        fetchOrders();
    }
  }, [orders, fetchOrders]);
  
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
        handleOrderUpdate(orderId, { observation: value });
    }, 700);
  };

  const handleVisibilityChange = async (productId: number, newVisibility: Product['visibility']) => {
    const productToUpdate = products.find(p => p.id === productId);
    if (productToUpdate) {
        await updateProduct({ ...productToUpdate, visibility: newVisibility });
        setSuccessMessage(`Visibilidade de '${productToUpdate.name}' atualizada.`);
    }
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

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumn = ["Data", "Cliente", "CPF", "Cadastro", "Produtos", "Status", "Observação", "Valor Total"];
    const tableRows: any[][] = [];

    orders.forEach(order => {
        const orderData = [
            new Date(order.date).toLocaleString('pt-BR'),
            order.customer.name,
            order.customer.cpf,
            order.customerStatus === 'registered' ? 'Realizado' : 'Pendente',
            order.items.map(i => `${i.name} (${i.quantity}x)`).join('; '),
            order.status === 'completed' ? 'Concluída' : 'Em Aberto',
            order.observation,
            formatCurrency(order.totalPrice)
        ];
        tableRows.push(orderData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
    });
    doc.text("Relatório de Pedidos", 14, 15);
    doc.save("relatorio_pedidos.pdf");
  }, [orders]);

  const exportToExcel = useCallback(() => {
    const worksheetData = orders.map(order => ({
        'Data': new Date(order.date).toLocaleString('pt-BR'),
        'Cliente': order.customer.name,
        'CPF': order.customer.cpf,
        'Email': order.customer.email,
        'Status Cadastro': order.customerStatus === 'registered' ? 'Realizado' : 'Pendente',
        'Produtos': order.items.map(i => `${i.name} (${i.quantity}x - ${formatCurrency(i.price*i.quantity)})`).join('; '),
        'Valor Total': order.totalPrice,
        'Status': order.status === 'completed' ? 'Concluída' : 'Em Aberto',
        'Observação': order.observation,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
      { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
    ];
    
    const valueColIndex = 6; // G column
    worksheetData.forEach((_, index) => {
        const cellRef = XLSX.utils.encode_cell({c: valueColIndex, r: index + 1});
        if (worksheet[cellRef]) {
            worksheet[cellRef].t = 'n';
            worksheet[cellRef].z = '"R$" #,##0.00';
        }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
    XLSX.writeFile(workbook, "relatorio_pedidos.xlsx");
  }, [orders]);

  const exportToTxt = useCallback(() => {
    const fileContent = orders.map(order => {
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

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pedidos_whatsapp.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [orders]);

  const baseInputClass = "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-gray-100 text-gray-800 placeholder-gray-500";
  const errorInputClass = "border-red-500 ring-1 ring-red-500";
  const errorTextClass = "text-red-600 text-sm mt-1";
  
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

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
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
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
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

      <div className="mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Relatório de Pedidos</h2>
          <div className="flex items-center space-x-2 flex-wrap justify-center">
            <button onClick={exportToPDF} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm">Exportar PDF</button>
            <button onClick={exportToExcel} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm">Exportar Excel</button>
            <button onClick={exportToTxt} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">Exportar TXT (WhatsApp)</button>
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
                    {orders.length > 0 ? (
                        orders.map(order => 
                            (
                                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
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
                        )
                    ) : (
                        <tr>
                            <td colSpan={9} className="text-center text-gray-500 py-8">
                                Nenhum pedido registrado.
                            </td>
                        </tr>
                    )}
                </tbody>
                 {orders.length > 0 && (
                    <tfoot className="bg-gray-50 font-semibold">
                         <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-gray-800 uppercase">Total Geral</td>
                            <td className="px-4 py-3 text-right text-gray-900">
                                {formatCurrency(orders.reduce((acc, order) => acc + order.totalPrice, 0))}
                            </td>
                            <td colSpan={4}></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista de Produtos</h2>
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
                    <th scope="col" className="px-6 py-3">Preço</th>
                    <th scope="col" className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
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
              {products.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum produto cadastrado.</p>}
            </div>
        )}
      </div>

      {isDeleteModalOpen && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4" aria-modal="true" role="dialog">
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
        </div>
      )}
    </div>
  );
};

export default Admin;
