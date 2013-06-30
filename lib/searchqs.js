exports.queries = {
    
     blogIndex : function(){
         
         return this.databaseUrl+'blog/';
     },
    
    postType : function(){
        
        return this.blogIndex()+'post/';
    },
    
    search : function(){
    
    return this.postType()+'_search';
    
    }
};