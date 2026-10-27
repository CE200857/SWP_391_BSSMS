package bssms_persistence.common;
import java.lang.reflect.*;
import java.sql.*;
import java.util.*;
import java.math.BigDecimal;
import bssms_security.PasswordUtil;
/** Dependency-free JDBC boundary tests; run main with -ea. No real database required. */
public final class WorkflowRegressionTest {
    static int commits,rollbacks; static boolean auto=true; static int step; static int sqlCode;
    interface Handler {Object invoke(String method,Object[] args)throws Throwable;}
    @SuppressWarnings("unchecked") static <T>T proxy(Class<T> type,Handler h){return (T)Proxy.newProxyInstance(type.getClassLoader(),new Class<?>[]{type},(o,m,a)->h.invoke(m.getName(),a));}
    static Object fallback(String name){if(name.equals("isClosed"))return false;return null;}
    static ResultSet rows(){
        int[] cursor={0};
        ResultSetMetaData md=proxy(ResultSetMetaData.class,(m,a)->m.equals("getColumnCount")?2:m.equals("getColumnLabel")?((int)a[0]==1?"invoice_id":"total_amount"):null);
        return proxy(ResultSet.class,(m,a)->m.equals("next")?++cursor[0]==1:m.equals("getMetaData")?md:m.equals("getObject")?((int)a[0]==1?42:new BigDecimal("123.45")):null);
    }
    static Connection connection(){
        Statement lock=proxy(Statement.class,(m,a)->m.equals("execute")?false:null);
        CallableStatement call=proxy(CallableStatement.class,(m,a)->{
            if(m.equals("execute")){step=0;if(sqlCode!=0)throw new SQLException("Business rejection","S0001",sqlCode);return false;}
            if(m.equals("getUpdateCount"))return step==0?1:-1;
            if(m.equals("getMoreResults"))return ++step==1;
            if(m.equals("getResultSet"))return rows();
            return null;
        });
        return proxy(Connection.class,(m,a)->{
            switch(m){
                case "getAutoCommit":return auto;
                case "setAutoCommit":auto=(boolean)a[0];return null;
                case "commit":commits++;return null;
                case "rollback":rollbacks++;return null;
                case "createStatement":return lock;
                case "prepareCall":return call;
                default:return fallback(m);
            }
        });
    }
    static void check(boolean ok,String message){if(!ok)throw new AssertionError(message);}
    public static void main(String[] args)throws Exception {
        Workflow w=new Workflow(connection(),2);
        List<Map<String,Object>> result=w.call("usp_CreateInvoice",2,3);
        check(result.size()==1 && result.get(0).get("invoiceId").equals(42),"must consume update counts before result set");
        check(result.get(0).get("totalAmount").equals(new BigDecimal("123.45")),"must preserve decimal money");
        sqlCode=51002;try{w.call("usp_SaveAppointment");throw new AssertionError();}catch(WorkflowException e){check(e.status==403,"SQL authorization mapping");}
        sqlCode=51004;try{w.call("usp_SaveAppointment");throw new AssertionError();}catch(WorkflowException e){check(e.status==409,"SQL conflict mapping");}
        sqlCode=0;
        check(w.transaction(()->7)==7 && commits==1 && auto,"successful transaction commits and restores autocommit");
        try{w.transaction(()->{throw new WorkflowException(409,"reject");});throw new AssertionError();}catch(WorkflowException expected){}
        check(rollbacks==1 && commits==1 && auto,"runtime business rejection rolls back");
        try{w.transaction(()->{throw new SQLException("broken");});throw new AssertionError();}catch(SQLException expected){}
        check(rollbacks==2 && auto,"SQL error rolls back");
        check(PasswordUtil.hashMD5("DemoSpa@2026").equals("fc5f6fa029643ec92b83d243a5c52d51"),"demo password compatibility");
        System.out.println("PASS: JDBC result handling, decimal preservation, role/conflict mapping, commit/rollback, demo MD5.");
    }
}
