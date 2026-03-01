// src/hooks/useTickets.js
import { useState, useEffect } from 'react';
import api from '../api/axios';

export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
  });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets/');
      setTickets(response.data.results || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tickets');
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTicket = async (id) => {
    try {
      const response = await api.get(`/tickets/${id}/`);
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to fetch ticket';
    }
  };

  const createTicket = async (ticketData) => {
    try {
      const response = await api.post('/tickets/', ticketData);
      await fetchTickets(); // Refresh the list
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to create ticket';
    }
  };

  const updateTicket = async (id, ticketData) => {
    try {
      const response = await api.put(`/tickets/${id}/`, ticketData);
      await fetchTickets(); // Refresh the list
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to update ticket';
    }
  };

  const deleteTicket = async (id) => {
    try {
      await api.delete(`/tickets/${id}/`);
      await fetchTickets(); // Refresh the list
      return true;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to delete ticket';
    }
  };

  const addComment = async (ticketId, comment) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/comments/`, { text: comment });
      return response.data;
    } catch (err) {
      throw err.response?.data?.message || 'Failed to add comment';
    }
  };

  // Filter tickets based on current filters
  const filteredTickets = tickets.filter(ticket => {
    // Status filter
    if (filters.status !== 'all' && ticket.status !== filters.status) {
      return false;
    }
    
    // Priority filter
    if (filters.priority !== 'all' && ticket.priority_score !== filters.priority) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return ticket.title.toLowerCase().includes(searchLower) ||
             ticket.description.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  // Get statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    critical: tickets.filter(t => t.priority_score === 'Critique').length,
    high: tickets.filter(t => t.priority_score === 'Élevé').length,
    medium: tickets.filter(t => t.priority_score === 'Moyen').length,
    low: tickets.filter(t => t.priority_score === 'Faible').length,
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    filteredTickets,
    loading,
    error,
    filters,
    setFilters,
    stats,
    fetchTickets,
    getTicket,
    createTicket,
    updateTicket,
    deleteTicket,
    addComment,
  };
};

export default useTickets;